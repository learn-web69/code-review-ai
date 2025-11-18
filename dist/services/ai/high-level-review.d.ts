interface HighLevelReviewStep {
    id: number;
    title: string;
    description: string;
    file: string;
    lines: string;
    url: string;
    lineNumber: number;
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
export declare function reviewPRWalkthrough(prUrl: string): Promise<HighLevelReviewStep[]>;
/**
 * Export types for external use
 */
export type { HighLevelReviewStep };
//# sourceMappingURL=high-level-review.d.ts.map