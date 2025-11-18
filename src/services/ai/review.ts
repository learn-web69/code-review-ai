// services/ai/review.ts
import { GoogleGenAI } from "@google/genai";
import { chunkArray } from "../../helpers/chunkArray.js";
import { getRelatedChunks } from "../qdrant/retrieve.js";
import type { AIReviewSummary, QdrantPoint } from "../../types/index.js";

interface FileBatch {
  file: string;
  code: string;
  relatedContext?: string;
}

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Configuration
const MAX_FILES_PER_BATCH = 5; // how many files we group in one AI call
const MAX_CODE_PREVIEW_CHARS = 2000; // prevent sending huge files

const STRUCTURED_PROMPT = `
You are an expert code reviewer.
For each code chunk below, provide a short structured JSON analysis describing what it does or what changed.

Return ONLY a valid JSON array with no markdown formatting, no backticks, and no explanatory text.

The JSON must match this schema exactly:
[
  {
    "file": "string",
    "chunkName": "string",
    "chunkType": "string",
    "steps": ["string"]
  }
]

Your entire response must be valid JSON that can be parsed directly.Here are the code chunks:
`;

const AI_RESPONSE_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      file: {
        type: "string",
        description: "The name of the file.", // Descriptions help the model
      },
      chunkName: {
        type: "string",
        description: "The name of the function or code chunk.",
      },
      chunkType: {
        type: "string",
        description: "e.g., 'function', 'class', 'variable'",
      },
      steps: {
        type: "array",
        items: { type: "string" },
        description: "A list of explanatory steps for this chunk.",
      },
    },
    required: ["file", "chunkName", "chunkType", "steps"],
  },
};

const generatePromptParts = (batch: FileBatch[]): string => {
  return batch
    .map(
      (f, idx) => `
### File ${idx + 1}: ${f.file}

${f.code.slice(0, MAX_CODE_PREVIEW_CHARS)}

RELATED CONTEXT:
${f.relatedContext || "(no related chunks found)"}
`
    )
    .join("\n");
};

const generatePrompt = (batch: FileBatch[]): string => {
  const promptParts = generatePromptParts(batch);

  return `${STRUCTURED_PROMPT}\n${promptParts}`;
};

const getAIReview = async (batch: FileBatch[]): Promise<AIReviewSummary[]> => {
  const promptText = generatePrompt(batch);

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
    } as unknown as Parameters<typeof genAI.models.generateContent>[0]);

    const responseText = result?.text?.replace(/```json\n?|\n?```/g, "").trim();

    if (responseText) {
      const parsedResponse = JSON.parse(responseText) as AIReviewSummary[];
      console.log("=== PARSED RESPONSE ===", parsedResponse);
      return parsedResponse;
    }

    return [];
  } catch (err) {
    console.error(`❌ Error in batch:`, err);
    return [];
  }
};

/**
 * Generate a code walkthrough summary for multiple files in one batch.
 */
export async function generateBatchReviews(
  fileChunks: FileBatch[]
): Promise<AIReviewSummary[]> {
  const batches = chunkArray(fileChunks, MAX_FILES_PER_BATCH);
  const allSummaries: AIReviewSummary[] = [];

  console.log(`Processing ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    console.log(`🧠 Sending batch ${i + 1}/${batches.length} to Gemini...`);

    const batch = batches[i];

    // Embed Qdrant context
    for (const chunk of batch) {
      const relatedChunks = await getRelatedChunks(chunk.code);
      chunk.relatedContext = (relatedChunks as unknown as QdrantPoint[])
        .map(
          (c) => `File: ${c.file}, Function: ${c.chunkName}\n${c.codeSnippet}`
        )
        .join("\n\n");
    }

    const aiOverviewResult = await getAIReview(batch);
    allSummaries.push(...aiOverviewResult);

    console.log(`✅ Batch ${i + 1}/${batches.length} processed`);
  }

  return allSummaries;
}
