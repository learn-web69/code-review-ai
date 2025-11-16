export interface FileContent {
    filePath: string;
    content: string;
}
export interface CodeChunk {
    type: "function" | "exportFunction" | "class" | "arrowFunction";
    name: string;
    codeSnippet: string;
}
export interface SemanticChunk {
    id: string;
    file: string;
    chunkName: string;
    chunkType: "function" | "class" | "interface" | "type" | "unknown";
    originalStartLine: number;
    originalEndLine: number;
    changedLines: ChangedLine[];
    contextBefore: string[];
    contextAfter: string[];
    diffHunks: DiffHunk[];
    codeSnippet: string;
    relatedContext?: string;
}
export interface ChangedLine {
    lineNumber: number;
    prefix: "+" | "-";
    content: string;
    oldNumber?: number;
    newNumber?: number;
}
export interface DiffHunk {
    file: string;
    blockHeader: string;
    changes: ChangedLine[];
    fullBlockLines: string[];
}
export interface CodeBlock {
    file: string;
    blockHeader: string;
    changes: Array<{
        type: "insert" | "delete" | "unchanged";
        text: string;
        oldNumber?: number;
        newNumber?: number;
    }>;
    fullBlockLines: string[];
}
export interface PRFile {
    filename: string;
    patch: string;
}
export interface AIReviewSummary {
    file: string;
    chunkName: string;
    steps: string[];
}
export interface QdrantPoint {
    file: string;
    chunkName: string;
    chunkType: string;
    codeSnippet: string;
}
//# sourceMappingURL=index.d.ts.map