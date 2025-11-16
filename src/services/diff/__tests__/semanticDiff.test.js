// services/diff/semanticDiff.extended.test.js
import { extractSemanticDiffChunks } from "../semanticDiff.js"; // TODO: convert to .ts
import assert from "assert";

/**
 * Test data: multiple chunks and partial changes
 */
const multiChunkFile = `function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) throw new Error("Divide by zero");
  return a / b;
}
`;

const multiChunkPatch = `
diff --git a/sample.js b/sample.js
index 1234567..89abcde 100644
--- a/sample.js
+++ b/sample.js
@@ -1,4 +1,5 @@
 function add(a, b) {
+  console.log("Adding numbers");
   return a + b;
 }
@@ -4,4 +5,6 @@
 function multiply(a, b) {
-  return a * b;
+  const result = a * b;
+  return result;
 }
@@ -8,5 +10,6 @@
 function divide(a, b) {
   if (b === 0) throw new Error("Divide by zero");
+  console.log("Dividing numbers");
   return a / b;
 }
`;

const partialChunkFile = `function greet(name) {
  console.log("Starting greet");
  const msg = \`Hello, \${name}\`;
  return msg;
  // unchanged line 1
  // unchanged line 2
}
`;

const partialChunkPatch = `
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

// ---------------------- MULTI-CHUNK TEST ----------------------
const multiChunks = extractSemanticDiffChunks(
  "sample.js",
  multiChunkFile,
  multiChunkPatch,
  2
);
console.log("Multi-chunk test result:", multiChunks);

// Expect 3 changed chunks
assert.strictEqual(multiChunks.length, 3, "Should return 3 changed chunks");

// Helper
const findChunk = (name) => multiChunks.find((c) => c.chunkName === name);

// Validate each chunk
multiChunks.forEach((chunk) => {
  assert.ok(
    Array.isArray(chunk.contextBefore),
    `${chunk.chunkName} contextBefore should be array`
  );
  assert.ok(
    Array.isArray(chunk.contextAfter),
    `${chunk.chunkName} contextAfter should be array`
  );
  assert.ok(
    Array.isArray(chunk.changedLines),
    `${chunk.chunkName} changedLines should be array`
  );

  // Each changed line: prefix and content
  chunk.changedLines.forEach((l) => {
    assert.ok(
      ["+", "-"].includes(l.prefix),
      "Changed line prefix should be '+' or '-'"
    );
    assert.ok(
      typeof l.content === "string",
      "Changed line content should be string"
    );
    assert.ok(l.lineNumber > 0, "Changed line should have valid lineNumber");
  });
});

// Specific chunk checks
const addChunk = findChunk("add");
assert.ok(
  addChunk.changedLines.some((l) => l.prefix === "+"),
  "'add' should have inserted line"
);

const multiplyChunk = findChunk("multiply");
assert.ok(
  multiplyChunk.changedLines.some((l) => l.prefix === "+"),
  "'multiply' should have inserted lines"
);
assert.ok(
  multiplyChunk.changedLines.some((l) => l.prefix === "-"),
  "'multiply' should have deleted lines"
);

const divideChunk = findChunk("divide");
assert.ok(
  divideChunk.changedLines.some((l) => l.prefix === "+"),
  "'divide' should have inserted line"
);

// Deterministic IDs
const ids = multiChunks.map((c) => c.id);
const ids2 = extractSemanticDiffChunks(
  "sample.js",
  multiChunkFile,
  multiChunkPatch,
  2
).map((c) => c.id);
assert.deepStrictEqual(ids, ids2, "IDs should be deterministic across runs");

console.log("✅ Multi-chunk test passed!");

// ---------------------- PARTIAL CHUNK TEST ----------------------
const partialChunks = extractSemanticDiffChunks(
  "partial.js",
  partialChunkFile,
  partialChunkPatch,
  2
);
console.log("Partial chunk test result:", partialChunks);

// Should detect 1 chunk
assert.strictEqual(partialChunks.length, 1, "Should detect 1 changed chunk");

const greetChunk = partialChunks[0];
assert.strictEqual(
  greetChunk.chunkName,
  "greet",
  "Chunk name should be 'greet'"
);
assert.strictEqual(
  greetChunk.chunkType,
  "function",
  "Chunk type should be 'function'"
);

// Should include only the inserted line
assert.strictEqual(
  greetChunk.changedLines.length,
  1,
  "Should have 1 changed line"
);
assert.strictEqual(
  greetChunk.changedLines[0].prefix,
  "+",
  "Changed line should be an insertion"
);
assert.strictEqual(
  greetChunk.changedLines[0].content,
  '  console.log("Greeting user");',
  "Changed line content should match inserted line"
);

// Context should include surrounding unchanged lines
console.log("GREET CHUNK", greetChunk, greetChunk.contextBefore);
assert.ok(
  greetChunk.contextBefore.includes("function greet(name) {"),
  "ContextBefore should include function start"
);
assert.ok(
  greetChunk.contextAfter.includes('  console.log("Starting greet");'),
  "ContextAfter should include next line"
);

// Deterministic ID
const greetId1 = greetChunk.id;
const greetId2 = extractSemanticDiffChunks(
  "partial.js",
  partialChunkFile,
  partialChunkPatch,
  2
)[0].id;
assert.strictEqual(greetId1, greetId2, "IDs should be deterministic");

console.log("✅ Partial chunk change test passed!");
