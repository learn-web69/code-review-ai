// services/diff/semanticDiff.js
import crypto from "crypto";
import { chunkFile } from "../../helpers/chunkFile.js";
import { extractChangedBlocks } from "../../helpers/extractChangedBlocks.js";

/**
 * Extract changed semantic chunks from a file using pre-parsed changed blocks
 *
 * @param {string} filePath
 * @param {string} fullFileContent
 * @param {string} patchText
 * @param {number} contextLines
 * @returns {Array} Semantic chunks ready for AI batching
 */
export function extractSemanticDiffChunks(
  filePath,
  fullFileContent,
  patchText,
  contextLines = 3
) {
  const fileLines = fullFileContent.split("\n");

  // 1. Extract changed blocks using existing helper
  const blocks = extractChangedBlocks(filePath, patchText);
  console.log(`[semanticDiff] File: ${filePath}, blocks: ${blocks.length}`);
  if (!blocks.length) {
    console.log(`[semanticDiff] No blocks found for ${filePath}`);
    return [];
  }

  // 2. Chunk the file into semantic units
  const semanticChunks = chunkFile(fullFileContent);
  console.log(
    `[semanticDiff] Semantic chunks in file: ${semanticChunks.length}`
  );
  const resultChunks = [];

  semanticChunks.forEach((chunk) => {
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
    const changedLines = [];
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
function findChunkStartLine(fileLines, chunkLines) {
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
function parseBlockStart(header) {
  const match = /@@ -\d+,\d+ \+(\d+),\d+ @@/.exec(header);
  return match ? parseInt(match[1], 10) : 1;
}
