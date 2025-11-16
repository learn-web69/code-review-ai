// services/diff/buildContext.ts

// @ts-ignore - diff2html doesn't have full TS support
import { parseDiff } from "diff2html/lib/parse.js";

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

export function extractChangedRanges(patchText: string): FileRangeResult[] {
  const parsed = parseDiff(patchText);

  const result: FileRangeResult[] = [];

  parsed.forEach((file: any) => {
    const fileRanges: FileRange[] = [];

    file.hunks.forEach((hunk: any) => {
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

export function buildContextBlocks(
  fullFileContent: string,
  ranges: FileRange[],
  radius: number = 12
): ContextBlock[] {
  const lines = fullFileContent.split("\n");
  const blocks: ContextBlock[] = [];

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
