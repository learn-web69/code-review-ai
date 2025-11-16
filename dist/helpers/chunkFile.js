/**
 * Splits a JS/TS file into chunks (functions, classes, arrow functions)
 */
export function chunkFile(content) {
    const chunks = [];
    const patterns = [
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
