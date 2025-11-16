// services/qdrant/retrieve.js
import { QdrantClient } from "@qdrant/js-client-rest";
import { getEmbedding } from "../ai/embeddings.js";

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = "code_chunks";

/**
 * Get top N related chunks from Qdrant for a given code snippet
 */
export async function getRelatedChunks(codeSnippet, top = 5) {
  const embedding = await getEmbedding(codeSnippet);

  const searchResult = await client.search(COLLECTION_NAME, {
    vector: embedding,
    limit: top,
  });

  return searchResult.map((r) => r.payload);
}
