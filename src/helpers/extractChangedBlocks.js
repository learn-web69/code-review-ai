// helpers/extractChangedBlocks.js

/**
 * Parse a unified diff patch and extract changed blocks.
 * The patch is expected to be just the hunks (no file headers from GitHub API).
 *
 * @param {string} filePath - The file path that changed
 * @param {string} patchText - The raw patch text from GitHub API (just the hunks).
 * @returns {Array<{
 *   file: string,
 *   blockHeader: string,
 *   changes: Array<{ type: "insert"|"delete", text: string, oldNumber?: number, newNumber?: number }>,
 *   fullBlockLines: string[]
 * }>}
 */
export function extractChangedBlocks(filePath, patchText) {
  if (!patchText || typeof patchText !== "string") {
    return [];
  }

  const results = [];
  const lines = patchText.split("\n");
  console.log(
    `[extractChangedBlocks] File: ${filePath}, patch lines: ${lines.length}`
  );

  let currentBlockHeader = null;
  let blockLines = [];
  let oldLineNum = 0;
  let newLineNum = 0;
  let blockCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect block header: @@ -oldStart,oldCount +newStart,newCount @@
    if (line.startsWith("@@")) {
      const blockMatch = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (blockMatch) {
        // Save previous block if it had changes
        if (blockLines.length > 0) {
          const changedLines = blockLines.filter(
            (l) => l.type === "insert" || l.type === "delete"
          );
          if (changedLines.length > 0) {
            results.push({
              file: filePath,
              blockHeader: currentBlockHeader,
              changes: changedLines,
              fullBlockLines: blockLines.map((l) => l.text),
            });
            blockCount++;
          }
        }

        currentBlockHeader = line;
        oldLineNum = parseInt(blockMatch[1], 10);
        newLineNum = parseInt(blockMatch[2], 10);
        blockLines = [];
      }
      continue;
    }

    // Parse changed lines (only if we're in a block)
    if (currentBlockHeader) {
      if (line.startsWith(" ")) {
        // Unchanged line
        blockLines.push({
          type: "unchanged",
          text: line.substring(1),
          oldNumber: oldLineNum,
          newNumber: newLineNum,
        });
        oldLineNum++;
        newLineNum++;
      } else if (line.startsWith("-")) {
        // Deleted line
        blockLines.push({
          type: "delete",
          text: line.substring(1),
          oldNumber: oldLineNum,
        });
        oldLineNum++;
      } else if (line.startsWith("+")) {
        // Added line
        blockLines.push({
          type: "insert",
          text: line.substring(1),
          newNumber: newLineNum,
        });
        newLineNum++;
      }
    }
  }

  // Don't forget the last block
  if (blockLines.length > 0) {
    const changedLines = blockLines.filter(
      (l) => l.type === "insert" || l.type === "delete"
    );
    if (changedLines.length > 0) {
      results.push({
        file: filePath,
        blockHeader: currentBlockHeader,
        changes: changedLines,
        fullBlockLines: blockLines.map((l) => l.text),
      });
      blockCount++;
    }
  }

  console.log(
    `[extractChangedBlocks] Found ${blockCount} blocks with changes for ${filePath}`
  );
  return results;
}
