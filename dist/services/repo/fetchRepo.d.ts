import type { FileContent } from "../../types/index.js";
/**
 * Fetch all repo files from GitHub API (memory-based, no disk storage)
 * Perfect for Vercel and serverless environments
 */
export declare function fetchRepo(repoUrl?: string, repoName?: string): Promise<{
    files: FileContent[];
}>;
//# sourceMappingURL=fetchRepo.d.ts.map