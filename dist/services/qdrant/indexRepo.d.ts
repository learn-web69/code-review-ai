interface FileWithContent {
    filePath: string;
    content: string;
}
interface RepoMetadata {
    repoId: string;
    repoName: string;
    lastCommit: string;
    chunkCount: number;
    filesIndexed: number;
    indexedAt: string;
}
/**
 * Check if repository is already indexed
 */
export declare function isRepoIndexed(repoId: string): Promise<boolean>;
/**
 * Get repository metadata
 */
export declare function getRepoMetadata(repoId: string): Promise<RepoMetadata | null>;
/**
 * Delete all points for a specific repository
 */
export declare function deleteRepo(repoId: string): Promise<void>;
/**
 * List all indexed repositories
 */
export declare function listAllRepos(): Promise<RepoMetadata[]>;
/**
 * Index provided files into Qdrant with repository metadata.
 *
 * @param repoId - Unique identifier for the repository (e.g., "owner_reponame")
 * @param repoName - Human-readable repository name
 * @param lastCommit - Git commit hash
 * @param files - Array of files with content
 * @returns Total number of chunks upserted
 */
export declare function indexRepo(repoId: string, repoName: string, lastCommit: string, files: FileWithContent[]): Promise<number>;
/**
 * Search for similar code chunks
 */
export declare function searchCode(queryVector: number[], repoId?: string, limit?: number): Promise<any[]>;
export {};
//# sourceMappingURL=indexRepo.d.ts.map