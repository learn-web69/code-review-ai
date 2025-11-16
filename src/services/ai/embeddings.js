// services/ai/embeddings.js
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Get embedding for a single code snippet using Gemini Embedding.
 * @param {string} text
 * @returns {Promise<number[]>} embedding vector
 */
export async function getEmbedding(text) {
  const response = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: {
      parts: [{ text }],
    },
  });

  // Response contains embeddings array
  return response.embeddings[0].values;
}

/**
 * Get embeddings for a batch of code snippets
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function getEmbeddingsBatch(texts) {
  const embeddings = [];

  for (const text of texts) {
    try {
      const embedding = await getEmbedding(text);
      embeddings.push(embedding);
    } catch (err) {
      console.error(`Failed to embed text: ${err.message}`);
      // Return zero vector as fallback with correct dimensions (1024)
      embeddings.push(new Array(1024).fill(0));
    }
  }

  return embeddings;
}
