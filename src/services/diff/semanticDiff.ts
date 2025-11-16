// services/diff/semanticDiff.ts
import crypto from "crypto";
import { chunkFile } from "../../helpers/chunkFile.js";
import { extractChangedBlocks } from "../../helpers/extractChangedBlocks.js"; // TODO: convert chunkFile to .ts
import type { CodeBlock, SemanticChunk } from "../../types/index.js";

interface ChunkedCode {
  name: string;
  type: string;
  codeSnippet: string;
}

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
export function extractSemanticDiffChunks(
  filePath: string,
  fullFileContent: string,
  patchText: string,
  contextLines: number = 3
): SemanticDiffChunk[] {
  const fileLines = fullFileContent.split("\n");

  // 1. Extract changed blocks using existing helper
  const blocks = extractChangedBlocks(filePath, patchText);
  console.log(`[semanticDiff] File: ${filePath}, blocks: ${blocks.length}`);
  if (!blocks.length) {
    console.log(`[semanticDiff] No blocks found for ${filePath}`);
    return [];
  }

  // 2. Chunk the file into semantic units
  const semanticChunks = chunkFile(fullFileContent) as ChunkedCode[];
  console.log(
    `[semanticDiff] Semantic chunks in file: ${semanticChunks.length}`
  );
  const resultChunks: SemanticDiffChunk[] = [];

  semanticChunks.forEach((chunk: ChunkedCode) => {
    const chunkLines = chunk.codeSnippet.split("\n");
    const startLine = findChunkStartLine(fileLines, chunkLines);
    if (startLine === -1) return;

    const endLine = startLine + chunkLines.length - 1;

    // 3. Find changed lines intersecting this chunk
    const intersectingBlocks = blocks.filter((block) => {
      const blockStart = parseBlockStart(block.blockHeader); // from @@ -.. +start,count @@
      const blockEnd = blockStart + block.fullBlockLines.length - 1;
      return blockEnd >= startLine && blockStart <= endLine;
    });

    if (!intersectingBlocks.length) return; // skip unchanged chunk

    // 4. Build changedLines array
    const changedLines: ChangedLine[] = [];
    intersectingBlocks.forEach((block) => {
      block.changes.forEach((c, idx) => {
        const lineNumber = parseBlockStart(block.blockHeader) + idx;
        if (lineNumber >= startLine && lineNumber <= endLine) {
          changedLines.push({
            lineNumber,
            prefix: c.type === "insert" ? "+" : "-",
            content: c.text.replace(/^[-+]/, ""), // <<< remove diff prefix if present
          });
        }
      });
    });

    // 5. Context lines
    const allChangedLineNumbers = changedLines.map((l) => l.lineNumber);
    const firstChangedLine = Math.min(...allChangedLineNumbers);
    const contextAfterEnd = Math.min(
      fileLines.length,
      Math.max(...allChangedLineNumbers) + contextLines
    );

    // <<< FIX: include chunk start, handle first line edge case
    let contextBeforeStart = Math.max(1, startLine - contextLines);
    let contextBeforeEnd = firstChangedLine - 1;

    // Edge case: if firstChangedLine === startLine, include the chunk start line
    if (firstChangedLine === startLine) {
      contextBeforeEnd = firstChangedLine; // include first line
    }

    const contextBefore = fileLines.slice(
      contextBeforeStart - 1,
      contextBeforeEnd
    );

    const contextAfter = fileLines.slice(
      Math.max(...allChangedLineNumbers),
      contextAfterEnd
    );

    // 6. Deterministic ID
    const id = crypto
      .createHash("sha1")
      .update(
        `${filePath}:${chunk.name}:${startLine}-${endLine}:${intersectingBlocks
          .map((b) => b.blockHeader)
          .join("|")}`
      )
      .digest("hex");

    // 7. Build semantic chunk object
    resultChunks.push({
      id,
      file: filePath,
      chunkName: chunk.name,
      chunkType: chunk.type,
      originalStartLine: startLine,
      originalEndLine: endLine,
      changedLines,
      contextBefore,
      contextAfter,
      diffHunks: intersectingBlocks,
      codeSnippet: chunk.codeSnippet,
    });
  });

  return resultChunks;
}

/**
 * Helper to locate chunk start line in full file
 */
function findChunkStartLine(fileLines: string[], chunkLines: string[]): number {
  const firstLine = chunkLines[0].trim();
  for (let i = 0; i < fileLines.length; i++) {
    if (fileLines[i].trim() === firstLine) return i + 1;
  }
  return -1;
}

/**
 * Helper to parse starting line from block header
 * e.g. "@@ -4,2 +4,3 @@" → returns 4
 */
function parseBlockStart(header: string): number {
  const match = /@@ -\d+,\d+ \+(\d+),\d+ @@/.exec(header);
  return match ? parseInt(match[1], 10) : 1;
}
