// services/diff/buildContext.ts
// @ts-ignore - diff2html doesn't have full TS support
import { parseDiff } from "diff2html/lib/parse.js";
export function extractChangedRanges(patchText) {
    const parsed = parseDiff(patchText);
    const result = [];
    parsed.forEach((file) => {
        const fileRanges = [];
        file.hunks.forEach((hunk) => {
            const start = hunk.newStart;
            const end = hunk.newStart + hunk.newLines - 1;
            fileRanges.push({ start, end });
        });
        result.push({
            file: file.newPath.replace(/^b\//, ""),
            ranges: fileRanges,
        });
    });
    return result;
}
export function buildContextBlocks(fullFileContent, ranges, radius = 12) {
    const lines = fullFileContent.split("\n");
    const blocks = [];
    ranges.forEach((range) => {
        const start = Math.max(1, range.start - radius);
        const end = Math.min(lines.length, range.end + radius);
        const snippet = lines.slice(start - 1, end).join("\n");
        blocks.push({
            start,
            end,
            snippet,
        });
    });
    return blocks;
}
