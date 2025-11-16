// services/ai/embeddings.ts
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Get embedding for a single code snippet using Gemini Embedding.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: {
      parts: [{ text }],
    },
  });

  // Response contains embeddings array
  if (!response.embeddings || !response.embeddings[0]?.values) {
    throw new Error("Invalid embedding response");
  }
  return response.embeddings[0].values;
}

/**
 * Get embeddings for a batch of code snippets
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    try {
      const embedding = await getEmbedding(text);
      embeddings.push(embedding);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to embed text: ${errorMsg}`);
      // Return zero vector as fallback with correct dimensions (1024)
      embeddings.push(new Array(1024).fill(0));
    }
  }

  return embeddings;
}
