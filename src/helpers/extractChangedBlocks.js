import { Diff2Html } from "diff2html";

/**
 * Parse a unified diff patch and extract changed blocks.
 *
 * @param {string} patchText - The raw patch text from GitHub API.
 * @returns {Array<{
 *   file: string,
 *   blockHeader: string,
 *   changes: Array<{ type: "insert"|"delete", text: string }>,
 *   fullBlockLines: string[]
 * }>}
 */
export function extractChangedBlocks(patchText) {
  if (!patchText || typeof patchText !== "string") return [];

  let structured;

  try {
    structured = Diff2Html.parse(patchText);
  } catch (err) {
    console.error("❌ Failed to parse diff:", err);
    return [];
  }

  const results = [];

  for (const file of structured) {
    if (!file.blocks) continue;

    for (const block of file.blocks) {
      const changedLines = block.lines.filter(
        (l) => l.type === "insert" || l.type === "delete"
      );

      if (changedLines.length === 0) continue;

      results.push({
        file: file.filePath,
        blockHeader: block.header, // e.g. "@@ -123,5 +123,6 @@"
        changes: changedLines.map((l) => ({
          type: l.type, // "insert" | "delete"
          text: l.text,
        })),
        fullBlockLines: block.lines.map((l) => l.text),
      });
    }
  }

  return results;
}
