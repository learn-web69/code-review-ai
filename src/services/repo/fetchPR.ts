// services/repo/fetchPR.ts

import { Octokit } from "@octokit/rest";
import type { PRFile } from "../../types/index.js";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export const getFilesByPR = async (
  pullNumber: number,
  owner: string,
  repo: string
): Promise<PRFile[]> => {
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return files as PRFile[];
};
