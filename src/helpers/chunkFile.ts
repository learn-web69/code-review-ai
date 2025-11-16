// helpers/chunkFile.ts
/**
 * Chunk object representing a code snippet
 */
export interface CodeChunk {
  type: "function" | "exportFunction" | "class" | "arrowFunction";
  name: string;
  codeSnippet: string;
}

interface PatternConfig {
  type: CodeChunk["type"];
  regex: RegExp;
}

/**
 * Splits a JS/TS file into chunks (functions, classes, arrow functions)
 */
export function chunkFile(content: string): CodeChunk[] {
  const chunks: CodeChunk[] = [];

  const patterns: PatternConfig[] = [
    {
      type: "function",
      regex: /function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*{[\s\S]*?^}/gm,
    },
    {
      type: "exportFunction",
      regex: /export\s+function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*{[\s\S]*?^}/gm,
    },
    { type: "class", regex: /class\s+([a-zA-Z0-9_]+)\s*{[\s\S]*?^}/gm },
    {
      type: "arrowFunction",
      regex: /const\s+([a-zA-Z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?^}/gm,
    },
  ];

  for (const p of patterns) {
    let match;
    while ((match = p.regex.exec(content)) !== null) {
      chunks.push({
        type: p.type,
        name: match[1],
        codeSnippet: match[0],
      });
    }
  }

  return chunks;
}
