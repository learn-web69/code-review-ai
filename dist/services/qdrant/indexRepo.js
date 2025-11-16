// services/qdrant/indexRepo.ts
import { QdrantClient } from "@qdrant/js-client-rest";
import { createHash } from "crypto";
import { chunkFile } from "../../helpers/chunkFile.js";
import { getEmbeddingsBatch } from "../ai/embeddings.js";
import { chunkArray } from "../../helpers/chunkArray.js";
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "code_chunks";
const VECTOR_SIZE = Number(process.env.EMBEDDING_DIM || 3072); // gemini-embedding-001 returns 3072 dimensions
const UPSERT_BATCH = Number(process.env.QDRANT_UPSERT_BATCH || 64); // upsert N points at once
// Validate required environment variables
if (!process.env.QDRANT_URL) {
    throw new Error("❌ Missing required environment variable: QDRANT_URL");
}
const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});
/**
 * Create collection if it doesn't exist.
 */
async function ensureCollection() {
    try {
        await client.createCollection(COLLECTION_NAME, {
            vectors: {
                size: VECTOR_SIZE,
                distance: "Cosine",
            },
        });
        console.log(`🟢 Created Qdrant collection "${COLLECTION_NAME}" (size=${VECTOR_SIZE})`);
    }
    catch (err) {
        const errAsAny = err;
        const msg = errAsAny?.message || String(err);
        const isAlreadyExists = msg.toLowerCase().includes("already exists") ||
            errAsAny?.status === 409 ||
            msg.includes("409");
        if (isAlreadyExists) {
            // Check if the existing collection has the correct dimensions
            try {
                const collectionInfo = await client.getCollection(COLLECTION_NAME);
                const existingDim = collectionInfo.config?.params?.vectors?.size ||
                    VECTOR_SIZE;
                if (existingDim !== VECTOR_SIZE) {
                    console.log(`⚠️ Collection has wrong dimensions (${existingDim}, expected ${VECTOR_SIZE}). Deleting and recreating...`);
                    await client.deleteCollection(COLLECTION_NAME);
                    await client.createCollection(COLLECTION_NAME, {
                        vectors: {
                            size: VECTOR_SIZE,
                            distance: "Cosine",
                        },
                    });
                    console.log(`🟢 Recreated Qdrant collection "${COLLECTION_NAME}" (size=${VECTOR_SIZE})`);
                }
                else {
                    console.log(`ℹ️ Collection "${COLLECTION_NAME}" already exists with correct dimensions`);
                }
            }
            catch (infoErr) {
                console.log(`ℹ️ Collection "${COLLECTION_NAME}" already exists`);
            }
        }
        else {
            throw err;
        }
    }
}
/**
 * Generate a deterministic UUID from file path and chunk name
 */
function normalizeId(filePath, chunkName) {
    const combined = `${filePath}::${chunkName}`;
    const hash = createHash("sha256").update(combined).digest("hex");
    // Convert hash to UUID format (v5-like, though not strictly v5)
    // Format: 8-4-4-4-12 hex digits
    const uuid = [
        hash.substring(0, 8),
        hash.substring(8, 12),
        hash.substring(12, 16),
        hash.substring(16, 20),
        hash.substring(20, 32),
    ].join("-");
    return uuid;
}
/**
 * Index provided files into Qdrant.
 * `files` is an array: [{ filePath, content }]
 */
export async function indexRepo(files) {
    if (!Array.isArray(files) || files.length === 0) {
        console.log("No files provided to index.");
        return 0;
    }
    await ensureCollection();
    // 1) Build all semantic chunks from files
    const allChunks = [];
    for (const file of files) {
        const chunks = chunkFile(file.content);
        if (!chunks || chunks.length === 0)
            continue;
        for (const chunk of chunks) {
            allChunks.push({
                file: file.filePath,
                chunkName: chunk.name || "anonymous",
                chunkType: chunk.type || "unknown",
                codeSnippet: chunk.codeSnippet,
            });
        }
    }
    console.log(`Prepared ${allChunks.length} chunks from ${files.length} files.`);
    if (allChunks.length === 0) {
        console.log("No chunks to index. Exiting.");
        return 0;
    }
    // 2) Process in batches: get embeddings in sub-batches (embedding service might also batch)
    // We'll break the allChunks into UPSERT_BATCH sized groups for embedding+upsert.
    const batches = chunkArray(allChunks, UPSERT_BATCH);
    let totalUpserted = 0;
    for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        console.log(`Embedding batch ${b + 1}/${batches.length} (size=${batch.length})...`);
        // Get embeddings for the batch (helper should do batch API)
        const texts = batch.map((c) => c.codeSnippet);
        const embeddings = await getEmbeddingsBatch(texts); // returns array of vectors
        // Build points
        const points = batch.map((chunk, idx) => ({
            id: normalizeId(chunk.file, chunk.chunkName),
            vector: embeddings[idx],
            payload: {
                file: chunk.file,
                chunkName: chunk.chunkName,
                chunkType: chunk.chunkType,
                codeSnippet: chunk.codeSnippet,
            },
        }));
        // Upsert into Qdrant
        await client.upsert(COLLECTION_NAME, {
            points,
        });
        totalUpserted += points.length;
        console.log(`  ⬆️ Upserted ${points.length} points (total so far: ${totalUpserted})`);
    }
    console.log(`✅ Indexing finished. Total points upserted: ${totalUpserted}`);
    return totalUpserted;
}
