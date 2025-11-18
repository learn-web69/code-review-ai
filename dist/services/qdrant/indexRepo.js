// services/qdrant/indexRepo.ts
import { QdrantClient } from "@qdrant/js-client-rest";
import { createHash } from "crypto";
import { chunkFile } from "../../helpers/chunkFile.js";
import { getEmbeddingsBatch } from "../ai/embeddings.js";
import { chunkArray } from "../../helpers/chunkArray.js";
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "code_chunks";
const VECTOR_SIZE = Number(process.env.EMBEDDING_DIM || 3072);
const UPSERT_BATCH = Number(process.env.QDRANT_UPSERT_BATCH || 64);
if (!process.env.QDRANT_URL) {
    throw new Error("❌ Missing required environment variable: QDRANT_URL");
}
const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});
/**
 * Ensure payload index exists for repoId field
 */
async function ensureRepoIdIndex() {
    try {
        await client.createPayloadIndex(COLLECTION_NAME, {
            field_name: "repoId",
            field_schema: "keyword",
        });
        console.log(`🟢 Created payload index for "repoId" field`);
    }
    catch (err) {
        const errAsAny = err;
        const msg = errAsAny?.message || String(err);
        const isAlreadyExists = msg.toLowerCase().includes("already exists") ||
            errAsAny?.status === 409;
        if (!isAlreadyExists) {
            console.error(`⚠️ Failed to create repoId index:`, err);
        }
    }
}
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
 * Generate a deterministic UUID from repo, file path and chunk name
 */
function normalizeId(repoId, filePath, chunkName) {
    const combined = `${repoId}::${filePath}::${chunkName}`;
    const hash = createHash("sha256").update(combined).digest("hex");
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
 * Generate file hash for change detection
 */
function generateFileHash(content) {
    return createHash("sha256").update(content).digest("hex");
}
/**
 * Check if repository is already indexed
 */
export async function isRepoIndexed(repoId) {
    try {
        const metadataId = normalizeId(repoId, "metadata", "repo-info");
        const result = await client.retrieve(COLLECTION_NAME, {
            ids: [metadataId],
        });
        return result.length > 0;
    }
    catch (err) {
        console.log(`Error checking repo: ${err}`);
        return false;
    }
}
/**
 * Get repository metadata
 */
export async function getRepoMetadata(repoId) {
    try {
        const metadataId = normalizeId(repoId, "metadata", "repo-info");
        const result = await client.retrieve(COLLECTION_NAME, {
            ids: [metadataId],
        });
        if (result.length > 0) {
            return result[0].payload;
        }
        return null;
    }
    catch (err) {
        console.log(`Error getting repo metadata: ${err}`);
        return null;
    }
}
/**
 * Create or update metadata point for a repository
 */
async function markRepoAsIndexed(repoId, repoName, lastCommit, chunkCount, filesIndexed) {
    try {
        // Create a deterministic UUID for the metadata point
        const metadataId = normalizeId(repoId, "metadata", "repo-info");
        const metadataPoint = {
            id: metadataId,
            vector: new Array(VECTOR_SIZE).fill(0.1), // Dummy vector with small values
            payload: {
                type: "metadata",
                repoId,
                repoName,
                lastCommit,
                chunkCount,
                filesIndexed,
                indexedAt: new Date().toISOString(),
            },
        };
        await client.upsert(COLLECTION_NAME, {
            points: [metadataPoint],
        });
        console.log(`✅ Metadata point created for repo: ${repoId}`);
    }
    catch (err) {
        console.error(`⚠️ Error creating metadata point: ${err}`);
        throw err;
    }
}
/**
 * Delete all points for a specific repository
 */
export async function deleteRepo(repoId) {
    try {
        // Ensure collection and index exist
        await ensureCollection();
        await ensureRepoIdIndex();
        // Scroll through all points with this repoId and collect their IDs
        const pointIds = [];
        let offset = null;
        while (true) {
            const scrollResult = await client.scroll(COLLECTION_NAME, {
                filter: {
                    must: [
                        {
                            key: "repoId",
                            match: { value: repoId },
                        },
                    ],
                },
                limit: 100,
                offset: offset || undefined,
                with_payload: false,
                with_vector: false,
            });
            if (scrollResult.points && scrollResult.points.length > 0) {
                pointIds.push(...scrollResult.points.map((p) => p.id));
            }
            if (!scrollResult.next_page_offset) {
                break;
            }
            offset = scrollResult.next_page_offset;
        }
        if (pointIds.length === 0) {
            console.log(`🗑️ No points found for repo: ${repoId}`);
            return;
        }
        // Delete all collected points by ID
        await client.delete(COLLECTION_NAME, {
            points: pointIds,
        });
        console.log(`🗑️ Deleted ${pointIds.length} points for repo: ${repoId}`);
    }
    catch (err) {
        console.error(`Error deleting repo: ${err}`);
        throw err;
    }
}
/**
 * List all indexed repositories
 */
export async function listAllRepos() {
    const repos = [];
    let offset = undefined;
    try {
        // First try to scroll all points and filter in memory
        while (true) {
            const result = await client.scroll(COLLECTION_NAME, {
                limit: 100,
                offset,
                with_vector: false,
            });
            const points = result.points || [];
            for (const point of points) {
                // Only include metadata points
                const payload = point.payload;
                if (payload.type === "metadata") {
                    repos.push(payload);
                }
            }
            if (!result.next_page_offset) {
                break;
            }
            offset = result.next_page_offset;
        }
        console.log(`✅ Found ${repos.length} indexed repositories`);
    }
    catch (err) {
        console.error(`Error listing repos: ${err}`);
        // Return empty array on error to prevent crashing
        return [];
    }
    return repos;
}
/**
 * Index provided files into Qdrant with repository metadata.
 *
 * @param repoId - Unique identifier for the repository (e.g., "owner_reponame")
 * @param repoName - Human-readable repository name
 * @param lastCommit - Git commit hash
 * @param files - Array of files with content
 * @returns Total number of chunks upserted
 */
export async function indexRepo(repoId, repoName, lastCommit, files) {
    if (!Array.isArray(files) || files.length === 0) {
        console.log("No files provided to index.");
        return 0;
    }
    // Check if already indexed
    if (await isRepoIndexed(repoId)) {
        const metadata = await getRepoMetadata(repoId);
        console.log(`⚠️ Repository "${repoId}" is already indexed (commit: ${metadata?.lastCommit})`);
        console.log(`💡 Use deleteRepo() first if you want to re-index, or check commit hash for updates`);
        return 0;
    }
    await ensureCollection();
    // 1) Build all semantic chunks from files
    const allChunks = [];
    const uniqueFiles = new Set();
    for (const file of files) {
        uniqueFiles.add(file.filePath);
        const fileHash = generateFileHash(file.content);
        const chunks = chunkFile(file.content);
        if (!chunks || chunks.length === 0)
            continue;
        for (const chunk of chunks) {
            allChunks.push({
                file: file.filePath,
                chunkName: chunk.name || "anonymous",
                chunkType: chunk.type || "unknown",
                codeSnippet: chunk.codeSnippet,
                fileHash,
            });
        }
    }
    console.log(`Prepared ${allChunks.length} chunks from ${files.length} files for repo: ${repoId}`);
    if (allChunks.length === 0) {
        console.log("No chunks to index. Exiting.");
        return 0;
    }
    // 2) Process in batches: get embeddings and upsert
    const batches = chunkArray(allChunks, UPSERT_BATCH);
    let totalUpserted = 0;
    for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        console.log(`Embedding batch ${b + 1}/${batches.length} (size=${batch.length})...`);
        const texts = batch.map((c) => c.codeSnippet);
        const embeddings = await getEmbeddingsBatch(texts);
        const points = batch.map((chunk, idx) => ({
            id: normalizeId(repoId, chunk.file, chunk.chunkName),
            vector: embeddings[idx],
            payload: {
                type: "code_chunk", // Important: distinguish from metadata
                repoId,
                repoName,
                file: chunk.file,
                fileHash: chunk.fileHash,
                chunkName: chunk.chunkName,
                chunkType: chunk.chunkType,
                codeSnippet: chunk.codeSnippet,
            },
        }));
        await client.upsert(COLLECTION_NAME, {
            points,
        });
        totalUpserted += points.length;
        console.log(`  ⬆️ Upserted ${points.length} points (total so far: ${totalUpserted})`);
    }
    // 3) Create metadata point AFTER successful indexing
    await markRepoAsIndexed(repoId, repoName, lastCommit, totalUpserted, uniqueFiles.size);
    console.log(`✅ Indexing finished. Total points upserted: ${totalUpserted}`);
    return totalUpserted;
}
/**
 * Search for similar code chunks
 */
export async function searchCode(queryVector, repoId, limit = 10) {
    const filter = {
        must: [
            {
                key: "type",
                match: { value: "code_chunk" }, // Exclude metadata points
            },
        ],
    };
    // Optionally filter by specific repo
    if (repoId) {
        filter.must.push({
            key: "repoId",
            match: { value: repoId },
        });
    }
    try {
        const results = await client.search(COLLECTION_NAME, {
            vector: queryVector,
            filter,
            limit,
        });
        return results;
    }
    catch (err) {
        console.error(`Error searching code: ${err}`);
        throw err;
    }
}
