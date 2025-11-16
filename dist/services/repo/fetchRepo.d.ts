import type { FileContent } from "../../types/index.js";
/**
 * Clone repo if not exists, otherwise pull latest.
 */
export declare function cloneRepo(repoUrl?: string, repoName?: string): string;
/**
 * Read all files in repo.
 */
export declare function loadRepoFiles(repoPath: string): FileContent[];
/**
 * Full pipeline:
 * - Clone/pull
 * - Load files
 */
export declare function fetchRepo(repoUrl?: string, repoName?: string): Promise<{
    repoPath: string;
    files: FileContent[];
}>;
//# sourceMappingURL=fetchRepo.d.ts.map