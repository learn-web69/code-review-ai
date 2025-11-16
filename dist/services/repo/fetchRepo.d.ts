import type { FileContent } from "../../types/index.js";
/**
 * Parse GitHub URL to extract owner and repo
 * Supports: https://github.com/owner/repo or git@github.com:owner/repo.git
 */
export declare function parseGitHubUrl(repoUrl: string): {
    owner: string;
    repo: string;
};
/**
 * Fetch all repo files from GitHub API (memory-based, no disk storage)
 * Perfect for Vercel and serverless environments
 */
export declare function fetchRepo(repoUrl?: string): Promise<{
    files: FileContent[];
}>;
//# sourceMappingURL=fetchRepo.d.ts.map