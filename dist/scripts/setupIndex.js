// scripts/setupIndex.ts
import { fetchRepo } from "../services/repo/fetchRepo.js";
import { indexRepo } from "../services/qdrant/indexRepo.js";
async function run() {
    try {
        console.log("📦 Fetching repository (clone/pull)...");
        const { files } = await fetchRepo();
        console.log(files.map((f) => f.filePath));
        console.log(`📁 Loaded ${files.length} files from repo.`);
        console.log("📡 Indexing repository into Qdrant...");
        const count = await indexRepo(files);
        console.log(`🎉 Done. Indexed ${count} vectors into Qdrant collection.`);
    }
    catch (err) {
        console.error("❌ Setup failed:", err);
        process.exit(1);
    }
}
run();
