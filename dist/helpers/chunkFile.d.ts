/**
 * Chunk object representing a code snippet
 */
export interface CodeChunk {
    type: "function" | "exportFunction" | "class" | "arrowFunction";
    name: string;
    codeSnippet: string;
}
/**
 * Splits a JS/TS file into chunks (functions, classes, arrow functions)
 */
export declare function chunkFile(content: string): CodeChunk[];
//# sourceMappingURL=chunkFile.d.ts.map