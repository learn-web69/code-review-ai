import type { CodeBlock } from "../types/index.js";
/**
 * Parse a unified diff patch and extract changed blocks.
 * The patch is expected to be just the hunks (no file headers from GitHub API).
 */
export declare function extractChangedBlocks(filePath: string, patchText: string): CodeBlock[];
//# sourceMappingURL=extractChangedBlocks.d.ts.map