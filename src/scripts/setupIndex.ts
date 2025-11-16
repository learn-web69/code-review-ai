// scripts/setupIndex.ts
import { fetchRepo } from "../services/repo/fetchRepo.js";
import { indexRepo } from "../services/qdrant/indexRepo.js";

async function run(): Promise<void> {
  try {
    console.log("📦 Fetching repository from GitHub API (memory-based)...");
    const { files } = await fetchRepo();

    console.log(`📁 Loaded ${files.length} files from GitHub:`);
    files.forEach((f) => console.log(`   - ${f.filePath}`));

    console.log("\n📡 Indexing repository into Qdrant...");
    const count = await indexRepo(files);

    console.log(`\n🎉 Done! Indexed ${count} vectors into Qdrant collection.`);
  } catch (err) {
    console.error("❌ Setup failed:", err);
    process.exit(1);
  }
}

run();
