import type { AIReviewSummary } from "../../types/index.js";
interface FileBatch {
    file: string;
    code: string;
    relatedContext?: string;
}
/**
 * Generate a code walkthrough summary for multiple files in one batch.
 */
export declare function generateBatchReviews(fileChunks: FileBatch[]): Promise<AIReviewSummary[]>;
export {};
//# sourceMappingURL=review.d.ts.map