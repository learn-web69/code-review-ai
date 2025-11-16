/**
 * Get embedding for a single code snippet using Gemini Embedding.
 */
export declare function getEmbedding(text: string): Promise<number[]>;
/**
 * Get embeddings for a batch of code snippets
 */
export declare function getEmbeddingsBatch(texts: string[]): Promise<number[][]>;
//# sourceMappingURL=embeddings.d.ts.map