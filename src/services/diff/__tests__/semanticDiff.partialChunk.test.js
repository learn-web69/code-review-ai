// services/diff/semanticDiff.partialChunk.test.js
import { extractSemanticDiffChunks } from "../semanticDiff.js"; // TODO: convert to .ts
import assert from "assert";

// Sample JS file with a function that will be partially changed
const partialFileContent = `function greet(name) {
  console.log("Starting greet");
  const msg = \`Hello, \${name}\`;
  return msg;
  // unchanged line 1
  // unchanged line 2
}
`;

// Sample patch: insert a line inside the function
const partialPatch = `
diff --git a/partial.js b/partial.js
index 1234567..89abcde 100644
--- a/partial.js
+++ b/partial.js
@@ -1,6 +1,7 @@
function greet(name) {
+  console.log("Greeting user");
   console.log("Starting greet");
   const msg = \`Hello, \${name}\`;
   return msg;
   // unchanged line 1
   // unchanged line 2
 }
`;

// Extract semantic diff chunks
const chunks = extractSemanticDiffChunks(
  "partial.js",
  partialFileContent,
  partialPatch,
  2
);

console.log("Partial chunk test result:", chunks);

// Assertions
assert.strictEqual(chunks.length, 1, "Should detect 1 changed chunk");

const chunk = chunks[0];
assert.strictEqual(chunk.chunkName, "greet", "Chunk name should be 'greet'");
assert.strictEqual(
  chunk.chunkType,
  "function",
  "Chunk type should be 'function'"
);

// Changed lines should include only the inserted line
assert.strictEqual(chunk.changedLines.length, 1, "Should have 1 changed line");
assert.strictEqual(
  chunk.changedLines[0].prefix,
  "+",
  "Changed line should be an insertion"
);
assert.strictEqual(
  chunk.changedLines[0].content,
  '  console.log("Greeting user");',
  "Changed line content should match the inserted line"
);

// Context before/after should include surrounding unchanged lines
assert.ok(
  chunk.contextBefore.includes("function greet(name) {"),
  "ContextBefore should include function start"
);
assert.ok(
  chunk.contextAfter.includes('  console.log("Starting greet");'),
  "ContextAfter should include next line"
);

// Check deterministic ID
const id1 = chunk.id;
const id2 = extractSemanticDiffChunks(
  "partial.js",
  partialFileContent,
  partialPatch,
  2
)[0].id;
assert.strictEqual(id1, id2, "IDs should be deterministic");

console.log("✅ Partial chunk change test passed!");
