// services/repo/indexService.ts
/**
 * Index Service
 *
 * Responsibilities:
 * - Fetch repository from GitHub API
 * - Index files into Qdrant
 * - Manage the indexing workflow
 *
 * Used by:
 * - setupIndex.ts (CLI script)
 * - POST /init-repository (API endpoint)
 */
import { fetchRepo } from "./fetchRepo.js";
import { indexRepo } from "../qdrant/indexRepo.js";
/**
 * Index a repository from GitHub URL
 * Fetches all files and creates embeddings in Qdrant
 */
export async function indexRepositoryFromUrl(repoUrl) {
    try {
        console.log(`📦 Fetching repository from GitHub API: ${repoUrl}...`);
        const { repoId, repoName, lastCommit, files } = await fetchRepo(repoUrl);
        console.log(`📁 Loaded ${files.length} files from GitHub:`);
        files.forEach((f) => console.log(`   - ${f.filePath}`));
        console.log("\n📡 Indexing repository into Qdrant...");
        const vectorsCount = await indexRepo(repoId, repoName, lastCommit, files);
        const message = `Successfully indexed ${vectorsCount} vectors from ${files.length} files`;
        console.log(`\n✅ ${message}`);
        return {
            success: true,
            repoUrl,
            filesCount: files.length,
            vectorsCount,
            message,
        };
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("❌ Repository indexing failed:", errorMessage);
        return {
            success: false,
            repoUrl,
            filesCount: 0,
            vectorsCount: 0,
            message: "Repository indexing failed",
            error: errorMessage,
        };
    }
}
