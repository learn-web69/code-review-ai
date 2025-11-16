import type { CodeBlock } from "../../types/index.js";
interface ChangedLine {
    lineNumber: number;
    prefix: "+" | "-";
    content: string;
}
interface SemanticDiffChunk {
    id: string;
    file: string;
    chunkName: string;
    chunkType: string;
    originalStartLine: number;
    originalEndLine: number;
    changedLines: ChangedLine[];
    contextBefore: string[];
    contextAfter: string[];
    diffHunks: CodeBlock[];
    codeSnippet: string;
}
/**
 * Extract changed semantic chunks from a file using pre-parsed changed blocks
 */
export declare function extractSemanticDiffChunks(filePath: string, fullFileContent: string, patchText: string, contextLines?: number): SemanticDiffChunk[];
export {};
//# sourceMappingURL=semanticDiff.d.ts.map