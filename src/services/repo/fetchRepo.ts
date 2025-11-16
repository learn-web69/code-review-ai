// services/repo/fetchRepo.ts

/**
 * Repo Fetcher (Memory-based using GitHub API)
 *
 * Responsibilities:
 * - Fetch repository files from GitHub API (no disk storage)
 * - Keep all data in memory
 * - Support Vercel serverless environment
 * - Recursively fetch JS/TS/JSX/TSX files
 * - Return structured list of files { filePath, content }
 *
 * No disk I/O - works on Vercel and other serverless platforms
 */

import { Octokit } from "@octokit/rest";
import type { FileContent } from "../../types/index.js";
import {
  DEFAULT_REPO_URL,
  DEFAULT_REPO_NAME,
  DEFAULT_REPO_OWNER,
} from "../../config/constants.js";

// GitHub API client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Parse GitHub URL to extract owner and repo
 * Supports: https://github.com/owner/repo or git@github.com:owner/repo.git
 */
function parseGitHubUrl(
  repoUrl: string
): { owner: string; repo: string } {
  // Handle https://github.com/owner/repo format
  const httpsMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // Handle git@github.com:owner/repo.git format
  const sshMatch = repoUrl.match(/github\.com:([^\/]+)\/([^\/\.]+)/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  throw new Error(`Invalid GitHub URL: ${repoUrl}`);
}

/**
 * Check if file should be included (JS/TS/JSX/TSX)
 */
function shouldIncludeFile(filePath: string): boolean {
  return (
    filePath.endsWith(".js") ||
    filePath.endsWith(".ts") ||
    filePath.endsWith(".jsx") ||
    filePath.endsWith(".tsx")
  );
}

/**
 * Recursively fetch files from GitHub using tree API
 * Returns all matching files with their content
 */
async function fetchFilesRecursive(
  owner: string,
  repo: string,
  treeSha: string,
  basePath: string = ""
): Promise<FileContent[]> {
  const files: FileContent[] = [];

  try {
    // Get tree data from GitHub API
    const response = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: "1",
    });

    // Filter files we care about
    const relevantFiles = response.data.tree.filter(
      (item) => item.type === "blob" && shouldIncludeFile(item.path!)
    );

    // Fetch content for each file
    for (const file of relevantFiles) {
      try {
        const contentResponse = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path!,
        });

        // Content is base64 encoded in the API response
        if ("content" in contentResponse.data) {
          const content = Buffer.from(
            contentResponse.data.content as string,
            "base64"
          ).toString("utf-8");

          files.push({
            filePath: file.path!,
            content,
          });
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch file ${file.path}:`, err);
        // Continue with next file
      }
    }
  } catch (err) {
    console.error(`❌ Error fetching tree from GitHub:`, err);
    throw err;
  }

  return files;
}

/**
 * Fetch all repo files from GitHub API (memory-based, no disk storage)
 * Perfect for Vercel and serverless environments
 */
export async function fetchRepo(
  repoUrl: string = DEFAULT_REPO_URL,
  repoName: string = DEFAULT_REPO_NAME
): Promise<{ files: FileContent[] }> {
  try {
    // Parse repository info from URL
    let repoInfo: { owner: string; repo: string };
    
    try {
      repoInfo = parseGitHubUrl(repoUrl);
    } catch {
      // Fall back to defaults if URL parsing fails
      repoInfo = { owner: DEFAULT_REPO_OWNER, repo: repoName };
    }

    console.log(
      `📡 Fetching repository from GitHub API: ${repoInfo.owner}/${repoInfo.repo}...`
    );

    // Get default branch
    const repoInfo_response = await octokit.repos.get({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
    });

    const defaultBranch = repoInfo_response.data.default_branch;
    console.log(`📌 Using branch: ${defaultBranch}`);

    // Get the tree SHA for the default branch
    const refResponse = await octokit.git.getRef({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      ref: `heads/${defaultBranch}`,
    });

    const treeSha = refResponse.data.object.sha;

    // Fetch all files recursively
    const files = await fetchFilesRecursive(
      repoInfo.owner,
      repoInfo.repo,
      treeSha
    );

    console.log(`✅ Fetched ${files.length} files from GitHub API`);

    return { files };
  } catch (err) {
    console.error("❌ Repository fetch failed:", err);
    throw err;
  }
}
