export interface IndexResult {
    success: boolean;
    repoUrl: string;
    filesCount: number;
    vectorsCount: number;
    message: string;
    error?: string;
}
/**
 * Index a repository from GitHub URL
 * Fetches all files and creates embeddings in Qdrant
 */
export declare function indexRepositoryFromUrl(repoUrl: string): Promise<IndexResult>;
//# sourceMappingURL=indexService.d.ts.map