// // file: basicWalkthrough.js

// /**
//  * Improved proof-of-concept walkthrough generator.
//  * Features:
//  * 1. Detect top-level functions, exported functions, classes, arrow functions
//  * 2. Ignore configuration files
//  *
//  * Why: This gives more meaningful walkthrough steps without using AI yet.
//  */

// import { getFilesByPR } from "./services/repo/fetchPR.js";

// // Import the array of code files from fetchRepo.js
// import { allCodeFiles } from "./services/repo/fetchRepo.js";
// import { isConfigFile } from "./helpers/isConfigFile.js";
// import { chunkFile } from "./helpers/chunkFile.js";
// import {
//   // generateChunkExplanation,
//   generateBatchReviews,
// } from "./services/ai/review.js";

// const generatePRWalkthrough = async () => {
//   const files = await getFilesByPR(33696);
//   const allChunks = [];

//   // const walkthroughSteps = [];

//   files.forEach((file) => {
//     const filePath = file.filename;

//     if (isConfigFile(filePath)) return; // skip config files

//     // If patch is present, use it; otherwise we could fetch full content
//     const fullFile = allCodeFiles.find((f) => f.filePath.endsWith(filePath));
//     if (!fullFile) return;
//     const content = fullFile.content;

//     const chunks = chunkFile(content);

//     chunks.forEach((chunk) => {
//       allChunks.push({
//         file: filePath,
//         chunkName: chunk.name,
//         chunkType: chunk.type,
//         code: chunk.codeSnippet,
//       });
//     });
//   });

//   console.log(`Total chunks to process: ${allChunks.length}`);

//   if (allChunks.length === 0) {
//     console.log("No chunks to process.");
//     return;
//   }

//   // Step 2: Send chunks to AI in batches
//   const batchSummaries = await generateBatchReviews(
//     allChunks.map((c) => ({ file: c.file, code: c.code }))
//   );

//   // Step 3: Map batch summaries back to chunks
//   // Note: This is a simple mapping, for demo we attach batch summary to each chunk
//   const walkthroughSteps = allChunks.map((chunk) => {
//     const batchSummary = batchSummaries.find((s) =>
//       s.summary.includes(chunk.file)
//     );

//     return {
//       file: chunk.file,
//       step: {
//         description: `AI summary for ${chunk.chunkType} "${chunk.chunkName}"`,
//         aiExplanation: batchSummary ? batchSummary.summary : "(no summary)",
//       },
//     };
//   });

//   console.log(JSON.stringify(walkthroughSteps.slice(0, 10), null, 2));

//   // Print first 5 walkthrough steps as JSON
//   // console.log(JSON.stringify(walkthroughSteps.slice(0, 10), null, 2));
// };

// generatePRWalkthrough();

import { getFilesByPR } from "./services/repo/fetchPR.js";
import { allCodeFiles } from "./services/repo/fetchRepo.js";
import { isConfigFile } from "./helpers/isConfigFile.js";
import { chunkFile } from "./helpers/chunkFile.js";
import { generateBatchReviews } from "./services/ai/review.js";

const generatePRWalkthrough = async () => {
  const files = await getFilesByPR(33696);
  const allChunks = [];

  // 1️⃣ Зібрати всі чанк-об’єкти
  files.forEach((file) => {
    const filePath = file.filename;
    if (isConfigFile(filePath)) return;

    const fullFile = allCodeFiles.find((f) => f.filePath.endsWith(filePath));
    if (!fullFile) return;

    const chunks = chunkFile(fullFile.content);
    chunks.forEach((chunk) => {
      allChunks.push({
        file: filePath,
        chunkName: chunk.name,
        chunkType: chunk.type,
        code: chunk.codeSnippet,
      });
    });
  });

  console.log(`Total chunks to process: ${allChunks.length}`);
  if (allChunks.length === 0) return console.log("No chunks to process.");

  // 2️⃣ Відправити всі чанки на AI в батчах
  const batchSummaries = await generateBatchReviews(allChunks);

  // 3️⃣ Зіставити результати по file + chunkName
  const walkthroughSteps = allChunks.map((chunk) => {
    const aiSummary = batchSummaries.find(
      (r) =>
        r.file === chunk.file &&
        r.chunkName?.toLowerCase() === chunk.chunkName?.toLowerCase()
    );

    return {
      file: chunk.file,
      step: {
        description: `AI summary for ${chunk.chunkType} "${chunk.chunkName}"`,
        aiExplanation: aiSummary
          ? aiSummary.steps.join("\n")
          : "(no summary found for this chunk)",
      },
    };
  });

  console.log(JSON.stringify(walkthroughSteps.slice(0, 10), null, 2));
};

generatePRWalkthrough();
