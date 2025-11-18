// services/ai/contextualReview.ts
import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { getEmbedding } from "./embeddings.js";
import type {
  CodeQuestionInput,
  CodeQuestionResult,
  ContextItem,
  ReviewStep,
} from "../../server/types.js";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = "code_chunks";

/**
 * Search QDrant for related code chunks based on the question and code context
 */
async function findRelatedContext(
  repoId: string,
  searchQuery: string,
  topK: number = 5
): Promise<ContextItem[]> {
  try {
    // Generate embedding for the search query
    const embedding = await getEmbedding(searchQuery);

    // Search Qdrant with repo filter
    const searchResult = await client.search(COLLECTION_NAME, {
      vector: embedding,
      limit: topK,
      filter: {
        must: [
          {
            key: "repoId",
            match: { value: repoId },
          },
        ],
      },
    });

    // Transform results to ContextItem format
    return searchResult.map((result) => {
      const payload = result.payload || {};
      return {
        file: (payload.file as string) || "unknown",
        chunk: (payload.codeSnippet as string) || "",
        chunkName: payload.chunkName as string,
        chunkType: payload.chunkType as string,
        relevanceScore: result.score,
      };
    });
  } catch (error) {
    console.error(`[ContextualReview] Error finding related context:`, error);
    return [];
  }
}

/**
 * Build a comprehensive search query from the user's question and context
 */
function buildSearchQuery(input: CodeQuestionInput): string {
  const parts: string[] = [];

  // Add the question itself
  parts.push(input.question);

  // Add code snippet if provided
  if (input.code) {
    parts.push(input.code);
  }

  // Add file context if provided
  if (input.file) {
    parts.push(`File: ${input.file}`);
  }

  return parts.join("\n");
}

/**
 * Build context for AI prompt from walkthrough steps
 */
function buildWalkthroughContext(walkthrough?: ReviewStep[]): string {
  if (!walkthrough || walkthrough.length === 0) {
    return "";
  }

  return (
    "\n\n### Previously Generated PR Walkthrough:\n" +
    walkthrough
      .map(
        (step, idx) =>
          `${idx + 1}. **${step.file}** - ${step.chunkName} (${
            step.chunkType
          })\n   ${step.explanation}`
      )
      .join("\n\n")
  );
}

/**
 * Build context from related code chunks found in QDrant
 */
function buildRelatedCodeContext(relatedContext: ContextItem[]): string {
  if (relatedContext.length === 0) {
    return "";
  }

  return (
    "\n\n### Related Code Context from Repository:\n" +
    relatedContext
      .map(
        (ctx, idx) =>
          `${idx + 1}. **${ctx.file}** - ${ctx.chunkName || "Code Block"} (${
            ctx.chunkType || "unknown"
          })\n` +
          `   Relevance: ${((ctx.relevanceScore || 0) * 100).toFixed(1)}%\n` +
          "```\n" +
          ctx.chunk +
          "\n```"
      )
      .join("\n\n")
  );
}

/**
 * Generate AI prompt for answering the code question
 */
function generatePrompt(
  input: CodeQuestionInput,
  relatedContext: ContextItem[]
): string {
  let prompt = `You are an expert code reviewer and software engineer. You are helping a developer understand code in a GitHub Pull Request.

### User's Question:
${input.question}`;

  // Add file and line context if available
  if (input.file) {
    prompt += `\n\n### File Context:
File: ${input.file}`;
    if (input.line) {
      prompt += `\nLine(s): ${input.line}`;
    }
  }

  // Add code snippet if provided
  if (input.code) {
    prompt += `\n\n### Code Being Asked About:
\`\`\`
${input.code}
\`\`\``;
  }

  // Add related code context from QDrant
  prompt += buildRelatedCodeContext(relatedContext);

  // Add walkthrough context if provided
  prompt += buildWalkthroughContext(input.walkthrough);

  // Add instructions
  prompt += `\n\n### Instructions:
Provide a clear, concise answer to the user's question. Use the related code context to give a complete explanation.
If the question refers to a function definition, class, or other code element, reference the related context to explain it.
Be specific and technical, but also explain concepts clearly.
If you reference code from the related context, mention which file it's from.

Answer:`;

  return prompt;
}

/**
 * Determine confidence level based on related context and question clarity
 */
function determineConfidence(
  relatedContext: ContextItem[],
  hasDirectCode: boolean
): "high" | "medium" | "low" {
  if (hasDirectCode && relatedContext.length >= 3) {
    const avgScore =
      relatedContext.reduce((sum, ctx) => sum + (ctx.relevanceScore || 0), 0) /
      relatedContext.length;
    if (avgScore > 0.7) return "high";
    if (avgScore > 0.5) return "medium";
  } else if (relatedContext.length >= 2) {
    return "medium";
  }
  return "low";
}

/**
 * Answer a code-related question using AI and QDrant context
 */
export async function answerCodeQuestion(
  input: CodeQuestionInput
): Promise<CodeQuestionResult> {
  console.log(
    `[ContextualReview] Processing question for repo: ${input.repoId}`
  );

  // Build search query from question and context
  const searchQuery = buildSearchQuery(input);
  console.log(
    `[ContextualReview] Search query: ${searchQuery.substring(0, 100)}...`
  );

  // Find related context from QDrant
  const relatedContext = await findRelatedContext(input.repoId, searchQuery, 5);
  console.log(
    `[ContextualReview] Found ${relatedContext.length} related code chunks`
  );

  // Generate AI prompt
  const prompt = generatePrompt(input, relatedContext);

  try {
    // Call Gemini API
    console.log(`[ContextualReview] Sending prompt to Gemini...`);
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    } as unknown as Parameters<typeof genAI.models.generateContent>[0]);

    const answer = result?.text?.trim() || "Unable to generate answer.";
    console.log(`[ContextualReview] Received answer (${answer.length} chars)`);

    // Determine confidence level
    const confidence = determineConfidence(relatedContext, !!input.code);

    // Build sources list
    const sources = relatedContext.map((ctx) => ctx.file);

    return {
      answer,
      relatedContext,
      confidence,
      sources: [...new Set(sources)], // Deduplicate sources
    };
  } catch (error) {
    console.error(`[ContextualReview] Error generating answer:`, error);
    throw new Error(`Failed to generate answer: ${(error as Error).message}`);
  }
}
