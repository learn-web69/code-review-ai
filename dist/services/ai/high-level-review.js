// services/ai/high-level-review.ts
import { GoogleGenAI } from "@google/genai";
import { Octokit } from "@octokit/rest";
import { extractChangedBlocks } from "../../helpers/extractChangedBlocks.js";
import crypto from "crypto";
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});
/**
 * Parse PR URL to extract owner, repo, and PR number
 * Supports formats:
 * - https://github.com/owner/repo/pull/123
 * - https://github.com/owner/repo/pull/123/files
 */
function parsePRUrl(prUrl) {
    const match = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!match) {
        throw new Error(`Invalid PR URL format: ${prUrl}`);
    }
    return {
        owner: match[1],
        repo: match[2],
        prNumber: parseInt(match[3], 10),
    };
}
/**
 * Extract line number ranges from a diff patch using extractChangedBlocks helper
 */
function extractLineRangesFromPatch(patch, filename) {
    if (!patch) {
        return { startLine: 0, endLine: 0 };
    }
    const blocks = extractChangedBlocks(filename, patch);
    if (blocks.length === 0) {
        return { startLine: 0, endLine: 0 };
    }
    // Extract line numbers from all changes across all blocks
    const lineNumbers = [];
    for (const block of blocks) {
        for (const change of block.changes) {
            if (change.newNumber !== undefined) {
                lineNumbers.push(change.newNumber);
            }
        }
    }
    if (lineNumbers.length === 0) {
        return { startLine: 0, endLine: 0 };
    }
    return {
        startLine: Math.min(...lineNumbers),
        endLine: Math.max(...lineNumbers),
    };
}
/**
 * Generate GitHub PR file URL with line numbers
 */
function generateFileUrl(owner, repo, prNumber, filename, startLine, endLine) {
    const baseUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}/files`;
    if (startLine > 0) {
        // Calculate GitHub's diff hash (SHA256 of filename)
        const diffHash = crypto.createHash('sha256').update(filename).digest('hex');
        // Use GitHub's format: #diff-<hash>R<start>-R<end>
        // R prefix indicates right-side (new file) line numbers
        const lineAnchor = endLine > startLine
            ? `R${startLine}-R${endLine}`
            : `R${startLine}`;
        return `${baseUrl}#diff-${diffHash}${lineAnchor}`;
    }
    return baseUrl;
}
/**
 * Fetch PR files and diffs from GitHub API
 */
async function fetchPRDiff(owner, repo, prNumber) {
    const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
    });
    return files;
}
/**
 * Enrich files with metadata (line ranges and URLs)
 */
function enrichFilesWithMetadata(files, owner, repo, prNumber) {
    return files.map((file) => {
        const blocks = extractChangedBlocks(file.filename, file.patch || "");
        const { startLine, endLine } = extractLineRangesFromPatch(file.patch || "", file.filename);
        const changeUrl = generateFileUrl(owner, repo, prNumber, file.filename, startLine, endLine);
        // Extract block info focusing on ACTUAL changed lines only
        const blockInfo = blocks.map((block) => {
            // Get line numbers from the actual changes (not context lines)
            const changedLineNumbers = block.changes
                .filter((change) => change.newNumber !== undefined)
                .map((change) => change.newNumber);
            // Extract code snippet (added/modified lines only)
            const codeLines = block.changes
                .filter((change) => change.type === 'insert' || change.type === 'unchanged')
                .map((change) => change.text);
            // Show ALL code - blocks are already chunked, no need to truncate further
            // Only truncate if a single block is ridiculously large (500+ lines)
            const maxLines = 500;
            const truncated = codeLines.length > maxLines;
            const displayLines = truncated ? codeLines.slice(0, maxLines) : codeLines;
            let codeSnippet = displayLines.join('\n');
            if (truncated) {
                const remainingLines = codeLines.length - maxLines;
                codeSnippet += `\n... (${remainingLines} more lines - block too large)`;
            }
            if (changedLineNumbers.length === 0) {
                // Fallback to block header if no new lines (all deletions)
                const headerMatch = block.blockHeader.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
                const startLine = headerMatch ? parseInt(headerMatch[1], 10) : 0;
                const blockUrl = generateFileUrl(owner, repo, prNumber, file.filename, startLine, startLine);
                return {
                    startLine,
                    endLine: startLine,
                    blockHeader: block.blockHeader,
                    codeSnippet,
                    url: blockUrl,
                };
            }
            const blockStartLine = Math.min(...changedLineNumbers);
            const blockEndLine = Math.max(...changedLineNumbers);
            const blockUrl = generateFileUrl(owner, repo, prNumber, file.filename, blockStartLine, blockEndLine);
            return {
                startLine: blockStartLine,
                endLine: blockEndLine,
                blockHeader: block.blockHeader,
                codeSnippet,
                url: blockUrl,
            };
        });
        return {
            ...file,
            startLine,
            endLine,
            changeUrl,
            blocks: blockInfo,
        };
    });
}
/**
 * Format file summaries for AI analysis with actual code snippets per block
 */
function formatFileSummariesForAI(files, owner, repo) {
    return files
        .map((file, index) => {
        const blockSummary = file.blocks
            .map((block, blockIdx) => {
            const lineRange = block.endLine > block.startLine
                ? `${block.startLine}-${block.endLine}`
                : `${block.startLine}`;
            // Show actual code snippet for each block
            const codePreview = block.codeSnippet
                ? `\n   Code:\n\`\`\`\n${block.codeSnippet}\n\`\`\``
                : '';
            return `  Block ${blockIdx}: Lines ${lineRange}${codePreview}`;
        })
            .join("\n\n");
        return `
${index + 1}. File: ${file.filename}
   Repository: ${owner}/${repo}
   Changed Blocks:
${blockSummary}
`;
    })
        .join("\n");
}
/**
 * Debug: Log AI request and response
 */
function logAIDebug(label, data) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🔍 DEBUG: ${label}`);
    console.log(`${"=".repeat(80)}`);
    if (typeof data === "string") {
        console.log(data);
    }
    else {
        console.log(JSON.stringify(data, null, 2));
    }
    console.log(`${"=".repeat(80)}\n`);
}
/**
 * Sleep utility for retry logic
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Generate high-level review from Gemini
 * AI focuses ONLY on describing changes - we handle line numbers and URLs
 */
async function getHighLevelReviewFromGemini(fileSummaries, prUrl, owner, repo, prNumber, filesMetadata) {
    const prompt = `You are an expert code reviewer. Analyze the following PR changes and identify the significant, high-level changes. Focus on architectural decisions, new features, and important refactoring.

PR URL: ${prUrl}
Repository: ${owner}/${repo}

Files Changed:
${fileSummaries}

IMPORTANT GUIDELINES:
1. For files with multiple blocks, specify which block number (0, 1, 2, etc.) each change refers to
2. For NEW files (entire file added): Create ONE comprehensive step covering the whole component/file, not multiple steps for the same file
3. For MODIFIED files with multiple distinct changes: Create separate steps for each block, specifying the blockIndex
4. Don't create multiple steps that point to the exact same code block - combine related changes into one step

ORDERING RULES (CRITICAL - FOLLOW STRICTLY):
1. **Component/File Creation ALWAYS comes first** - If a new component is created, that step must be the FIRST step for that component
2. **Implementation details come after creation** - Features within a component (like mobile handling, context usage) come AFTER the creation step
3. **Dependencies before usage** - Define/create things before they are integrated or used
4. **Integration comes last** - Steps that connect components together come after all components are defined
5. Example correct order:
   - Step 1: "Create WikiViewer Component" (new component definition)
   - Step 2: "Add mobile URL handling to WikiViewer" (feature detail)
   - Step 3: "Add state to App" (prepare for integration)
   - Step 4: "Add handlers to App" (prepare for integration)
   - Step 5: "Integrate WikiViewer in App" (final integration)
6. Example WRONG order (DO NOT DO THIS):
   - ❌ "Add mobile handling to WikiViewer" BEFORE "Create WikiViewer" (backwards!)
   - ❌ "Integrate Component" BEFORE "Create Component" (backwards!)

When you describe a NEW component, the first step mentioning that component MUST be its creation, not a detail about it.

Instructions:
1. Identify 4-7 significant changes (ignore minor formatting, documentation)
2. For each change, provide:
   - A brief, clear title (3-7 words)
   - A detailed description explaining what changed and why it matters (2-3 sentences)
   - The filename where this change occurs (EXACT filename as shown above)
   - The blockIndex (0, 1, 2, etc.) - REQUIRED for files with multiple blocks
   - IMPORTANT: If describing a specific feature within a block, also provide:
     * startLine: The exact line number where this specific feature/change starts (EXCLUDE imports, focus on actual code changes)
     * endLine: The exact line number where this specific feature/change ends
     * Example: If a block spans lines 8-15 but lines 8-9 are just imports and the actual state change is lines 14-15, specify startLine: 14, endLine: 15
     * Example: If mobile handling logic is on lines 18-28, specify startLine: 18, endLine: 28
3. Order changes logically: definitions before usage, dependencies before dependents
4. For new component creation, you can omit startLine/endLine (whole file). For specific features, provide exact lines.

Return ONLY a valid JSON array (no markdown, no code blocks):
[
  {
    "title": "Brief title of the change",
    "description": "Detailed explanation of what changed and why it matters.",
    "file": "exact/path/to/file.tsx",
    "blockIndex": 0,
    "startLine": 18,
    "endLine": 28
  }
]`;
    // 📍 DEBUG: Log what we're sending to AI
    logAIDebug("PROMPT SENT TO GEMINI", prompt);
    // Retry logic for rate limiting
    const maxRetries = 3;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Attempt ${attempt}/${maxRetries} to call Gemini API...`);
            const result = await genAI.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });
            const rawResponse = result?.text || "";
            // 📍 DEBUG: Log raw AI response
            logAIDebug("RAW RESPONSE FROM GEMINI", rawResponse);
            const responseText = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
            // 📍 DEBUG: Log cleaned response
            logAIDebug("CLEANED RESPONSE (after removing markdown)", responseText);
            if (responseText) {
                const parsedResponse = JSON.parse(responseText);
                // 📍 DEBUG: Log parsed response before enrichment
                logAIDebug("PARSED RESPONSE FROM AI", parsedResponse);
                // Now WE generate the accurate line numbers and URLs based on actual diff data
                const enrichedResponse = parsedResponse.map((item, index) => {
                    const fileMetadata = filesMetadata.find((f) => f.filename === item.file);
                    if (fileMetadata) {
                        let lineRange;
                        let lineNumber;
                        let blockUrl;
                        if (fileMetadata.blocks.length === 1) {
                            // Single block - check if AI provided specific line numbers
                            const block = fileMetadata.blocks[0];
                            if (item.startLine !== undefined && item.endLine !== undefined) {
                                // AI specified exact lines within the block - use them!
                                lineRange = item.endLine > item.startLine
                                    ? `${item.startLine}-${item.endLine}`
                                    : `${item.startLine}`;
                                lineNumber = item.startLine;
                                // Generate URL with AI's specific lines
                                blockUrl = generateFileUrl(owner, repo, prNumber, item.file, item.startLine, item.endLine);
                            }
                            else {
                                // No specific lines - use entire block
                                lineRange =
                                    block.endLine > block.startLine
                                        ? `${block.startLine}-${block.endLine}`
                                        : `${block.startLine}`;
                                lineNumber = block.startLine;
                                blockUrl = block.url;
                            }
                        }
                        else if (fileMetadata.blocks.length > 1) {
                            // Multiple blocks - use AI's blockIndex if provided
                            let selectedBlock = fileMetadata.blocks[0]; // default to first
                            if (item.blockIndex !== undefined && fileMetadata.blocks[item.blockIndex]) {
                                // AI specified which block - use it!
                                selectedBlock = fileMetadata.blocks[item.blockIndex];
                            }
                            else {
                                // AI didn't specify or invalid index - default to first block
                                console.warn(`⚠️ AI didn't specify valid blockIndex for "${item.title}" in ${item.file}, using first block`);
                            }
                            // Check if AI provided specific line numbers within the block
                            if (item.startLine !== undefined && item.endLine !== undefined) {
                                lineRange = item.endLine > item.startLine
                                    ? `${item.startLine}-${item.endLine}`
                                    : `${item.startLine}`;
                                lineNumber = item.startLine;
                                blockUrl = generateFileUrl(owner, repo, prNumber, item.file, item.startLine, item.endLine);
                            }
                            else {
                                // Use entire block range
                                lineRange =
                                    selectedBlock.endLine > selectedBlock.startLine
                                        ? `${selectedBlock.startLine}-${selectedBlock.endLine}`
                                        : `${selectedBlock.startLine}`;
                                lineNumber = selectedBlock.startLine;
                                blockUrl = selectedBlock.url;
                            }
                        }
                        else {
                            // No blocks - use overall file range
                            lineRange =
                                fileMetadata.endLine > fileMetadata.startLine
                                    ? `${fileMetadata.startLine}-${fileMetadata.endLine}`
                                    : `${fileMetadata.startLine}`;
                            lineNumber = fileMetadata.startLine;
                            blockUrl = fileMetadata.changeUrl;
                        }
                        return {
                            id: index + 1,
                            title: item.title,
                            description: item.description,
                            file: item.file,
                            lines: lineRange,
                            lineNumber: lineNumber,
                            url: blockUrl, // Use block-specific URL!
                        };
                    }
                    else {
                        // Fallback if file not found (shouldn't happen)
                        return {
                            id: index + 1,
                            title: item.title,
                            description: item.description,
                            file: item.file,
                            lines: "0",
                            lineNumber: 0,
                            url: `https://github.com/${owner}/${repo}/pull/${prNumber}/files`,
                        };
                    }
                });
                // 📍 DEBUG: Log final enriched response
                logAIDebug("FINAL RESPONSE (with our line numbers & URLs)", enrichedResponse);
                return enrichedResponse;
            }
            return [];
        }
        catch (err) {
            lastError = err;
            const errorMessage = err.message || JSON.stringify(err);
            // Check if it's a rate limit error (429)
            if (errorMessage.includes("429") ||
                errorMessage.includes("RESOURCE_EXHAUSTED")) {
                const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
                console.warn(`⚠️  Rate limit hit (429). Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}...`);
                if (attempt < maxRetries) {
                    await sleep(waitTime);
                    continue; // Retry
                }
                else {
                    console.error("❌ Max retries reached. Rate limit still active.");
                }
            }
            // For other errors, don't retry
            console.error(`❌ Error calling Gemini API (attempt ${attempt}):`, err);
            break;
        }
    }
    // If we get here, all retries failed
    console.error("❌ Failed to get high-level review from Gemini after retries:", lastError);
    throw lastError || new Error("Failed to get review from Gemini");
}
/**
 * Main function: Takes PR URL, pulls diff, and returns high-level review walkthrough
 *
 * @param prUrl - Full GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)
 * @returns Array of high-level review steps in logical order
 *
 * @example
 * const review = await reviewPRWalkthrough("https://github.com/reactjs/react.dev/pull/5619");
 * // Returns array of HighLevelReviewStep objects
 */
export async function reviewPRWalkthrough(prUrl) {
    try {
        // Parse PR URL
        console.log(`📋 Parsing PR URL: ${prUrl}`);
        const { owner, repo, prNumber } = parsePRUrl(prUrl);
        // Fetch PR diff
        console.log(`📥 Fetching PR #${prNumber} diff from ${owner}/${repo}...`);
        const files = await fetchPRDiff(owner, repo, prNumber);
        if (!files.length) {
            console.log("⚠️  No files changed in this PR");
            return [];
        }
        console.log(`📄 Found ${files.length} changed files`);
        // 📍 DEBUG: Log fetched files
        logAIDebug("FETCHED FILES FROM GITHUB", files.map((f) => ({
            filename: f.filename,
            patch: `[patch length: ${f.patch?.length || 0} chars]`,
        })));
        // Enrich files with metadata (line ranges and URLs)
        const filesWithMetadata = enrichFilesWithMetadata(files, owner, repo, prNumber);
        // 📍 DEBUG: Log enriched files with metadata
        logAIDebug("FILES WITH METADATA (actual changed line ranges)", filesWithMetadata.map((f) => ({
            filename: f.filename,
            overallRange: `${f.startLine}-${f.endLine}`,
            blocks: f.blocks.map((b) => ({
                lines: `${b.startLine}-${b.endLine}`,
                header: b.blockHeader,
            })),
        })));
        // Format file summaries for AI
        const fileSummaries = formatFileSummariesForAI(filesWithMetadata, owner, repo);
        // 📍 DEBUG: Log formatted summaries
        logAIDebug("FILE SUMMARIES FOR AI", fileSummaries);
        // Get high-level review from Gemini
        console.log("🧠 Requesting high-level review from Gemini...");
        const review = await getHighLevelReviewFromGemini(fileSummaries, prUrl, owner, repo, prNumber, filesWithMetadata);
        console.log(`✅ High-level review complete: ${review.length} steps identified`);
        return review;
    }
    catch (error) {
        console.error("❌ Error in PR walkthrough review:", error);
        throw error;
    }
}
