interface FileRange {
    start: number;
    end: number;
}
interface FileRangeResult {
    file: string;
    ranges: FileRange[];
}
interface ContextBlock {
    start: number;
    end: number;
    snippet: string;
}
export declare function extractChangedRanges(patchText: string): FileRangeResult[];
export declare function buildContextBlocks(fullFileContent: string, ranges: FileRange[], radius?: number): ContextBlock[];
export {};
//# sourceMappingURL=buildContext.d.ts.map