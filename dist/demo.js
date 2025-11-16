// demo.ts
import { getFilesByPR } from "./services/repo/fetchPR.js";
import { fetchRepo, parseGitHubUrl } from "./services/repo/fetchRepo.js";
import { DEFAULT_REPO_URL } from "./config/constants.js";
import { isConfigFile } from "./helpers/isConfigFile.js";
import { extractSemanticDiffChunks } from "./services/diff/semanticDiff.js";
import { generateBatchReviews } from "./services/ai/review.js";
import { getRelatedChunks } from "./services/qdrant/retrieve.js";
const CONTEXT_LINES = 5; // lines of context around changes
async function demoPRWalkthrough(prNumber) {
    console.log(`Fetching PR #${prNumber} files...`);
    // Extract owner and repo from URL
    const { owner, repo } = parseGitHubUrl(DEFAULT_REPO_URL);
    const files = (await getFilesByPR(prNumber, owner, repo));
    // Fetch repo files in memory (GitHub API)
    const { files: repoFiles } = await fetchRepo(DEFAULT_REPO_URL);
    const allChunks = [];
    for (const file of files) {
        const filePath = file.filename;
        if (isConfigFile(filePath))
            continue;
        const fullFile = repoFiles.find((f) => f.filePath.endsWith(filePath));
        if (!fullFile)
            continue;
        const semanticChunks = extractSemanticDiffChunks(filePath, fullFile.content, file.patch, CONTEXT_LINES);
        for (const chunk of semanticChunks) {
            // Retrieve related code from Qdrant
            const relatedChunks = await getRelatedChunks(chunk.codeSnippet, 3);
            console.log("=== RELATED CHUNKS", relatedChunks.length);
            chunk.relatedContext = relatedChunks
                .map((c) => `File: ${c.file}, Function: ${c.chunkName}\n${c.codeSnippet}`)
                .join("\n\n");
            allChunks.push(chunk);
        }
    }
    console.log(`Total semantic chunks to process: ${allChunks.length}`);
    if (!allChunks.length)
        return console.log("No changed chunks found in this PR.");
    // 2. Generate AI review using Gemini
    const batchSummaries = await generateBatchReviews(allChunks.map((chunk) => ({
        file: chunk.file,
        code: chunk.codeSnippet,
    })));
    // 3. Map summaries to chunks
    const walkthroughSteps = allChunks.map((chunk) => {
        const aiSummary = batchSummaries.find((r) => r.file === chunk.file &&
            r.chunkName?.toLowerCase() === chunk.chunkName?.toLowerCase());
        return {
            file: chunk.file,
            chunkName: chunk.chunkName,
            chunkType: chunk.chunkType,
            step: {
                description: `AI summary for ${chunk.chunkType} "${chunk.chunkName}"`,
                aiExplanation: aiSummary
                    ? aiSummary.steps.join("\n")
                    : "(no summary found)",
                relatedContext: chunk.relatedContext,
            },
        };
    });
    console.log("\n=== PR Walkthrough ===\n");
    walkthroughSteps.forEach((step, idx) => {
        console.log(`Step ${idx + 1}: ${step.step.description}`);
        console.log(`Changed Lines:`);
        console.log(step.step.aiExplanation);
        console.log(`Related Context:`);
        console.log(step.step.relatedContext || "(none)");
        console.log("--------------------------------------------------\n");
    });
}
// Example usage:
demoPRWalkthrough(83);
