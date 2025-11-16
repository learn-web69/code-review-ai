// scripts/setupIndex.ts
import { indexRepositoryFromUrl } from "../services/repo/indexService.js";
import { DEFAULT_REPO_URL } from "../config/constants.js";
async function run() {
    try {
        const repoUrl = process.env.REPO_URL || DEFAULT_REPO_URL;
        if (!repoUrl) {
            throw new Error("REPO_URL environment variable or DEFAULT_REPO_URL must be set");
        }
        console.log(`\n� Starting repository indexing for: ${repoUrl}\n`);
        const result = await indexRepositoryFromUrl(repoUrl);
        if (!result.success) {
            console.error(`\n❌ Indexing failed: ${result.error}`);
            process.exit(1);
        }
        console.log(`\n✨ Indexing complete!`);
        console.log(`   Files: ${result.filesCount}`);
        console.log(`   Vectors: ${result.vectorsCount}`);
    }
    catch (err) {
        console.error("❌ Setup failed:", err);
        process.exit(1);
    }
}
run();
