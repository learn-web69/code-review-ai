// file: index.js

import { getFilesByPR } from "./services/repo/fetchPR.js";
import { loadRepoFiles } from "./services/repo/fetchRepo.js";
import { isConfigFile } from "./helpers/isConfigFile.js";
import { chunkFile } from "./helpers/chunkFile.js";
import { generateBatchReviews } from "./services/ai/review.js";

const PR_NUMBER = 83;
const REPO_PATH = "./tempRepo/wikitok";

const generatePRWalkthrough = async () => {
  const prFiles = await getFilesByPR(PR_NUMBER);
  const allCodeFiles = loadRepoFiles(REPO_PATH);
  const allChunks = [];

  prFiles.forEach((file) => {
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

  const batchSummaries = await generateBatchReviews(allChunks);

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
