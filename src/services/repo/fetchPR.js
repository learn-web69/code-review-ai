import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const owner = "facebook";
const repo = "react";

export const getFilesByPR = async (pullNumber = 1) => {
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return files;
};
