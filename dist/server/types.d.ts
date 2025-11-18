export interface StatusResponse {
    status: "ok" | "error";
    indexed: boolean;
    message: string;
}
export interface InitRepositoryRequest {
    repo_url?: string;
    branch?: string;
}
export interface InitRepositoryResponse {
    status: "processing" | "success" | "error";
    repo_id: string;
    message: string;
    steps: string[];
}
export interface ReviewPRRequest {
    repo_id?: string;
    owner?: string;
    repo?: string;
}
export interface ReviewStep {
    file: string;
    chunkName: string;
    chunkType: string;
    explanation: string;
}
export interface ReviewPRResponse {
    status: "processing" | "success" | "error";
    pr_number: number;
    message: string;
    steps: string[] | ReviewStep[];
}
export interface ToolsReviewRequest {
    repo_id: string;
    file?: string;
    line?: string;
    code?: string;
    question: string;
    walkthrough?: ReviewStep[];
}
export interface ContextItem {
    file: string;
    chunk: string;
    chunkName?: string;
    chunkType?: string;
    relevanceScore?: number;
}
export interface ToolsReviewResponse {
    status: "success" | "error";
    answer: string;
    relatedContext: ContextItem[];
    confidence?: "high" | "medium" | "low";
    sources?: string[];
}
export interface CodeQuestionInput {
    repoId: string;
    file?: string;
    line?: string;
    code?: string;
    question: string;
    walkthrough?: ReviewStep[];
}
export interface CodeQuestionResult {
    answer: string;
    relatedContext: ContextItem[];
    confidence: "high" | "medium" | "low";
    sources: string[];
}
export interface ErrorResponse {
    error: string;
    path?: string;
    details?: any;
}
export interface RepositoryMetadata {
    repo_id: string;
    repo_url: string;
    branch: string;
    indexed: boolean;
    indexed_at?: string;
    last_updated?: string;
    qdrant_collection_name: string;
}
export interface ReviewResult {
    id: string;
    repo_id: string;
    pr_number: number;
    steps: ReviewStep[];
    generated_at: string;
    ttl?: number;
}
//# sourceMappingURL=types.d.ts.map