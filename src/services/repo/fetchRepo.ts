// services/repo/fetchRepo.ts

/**
 * Repo Fetcher
 *
 * Responsibilities:
 * - Clone a GitHub repo into temp folder (only when needed)
 * - Pull latest changes if repo already exists
 * - Recursively read all JS/TS/JSX/TSX files
 * - Return structured list of files { filePath, content }
 *
 * This version does NOT clone on import, which is important for:
 * - Indexing scripts
 * - Background jobs
 * - Multi-repo support
 * - Qdrant + RAG indexing flows
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { FileContent } from "../../types/index.js";
import {
  DEFAULT_REPO_URL,
  DEFAULT_REPO_NAME,
  REPOS_ROOT,
} from "../../config/constants.js";

/**
 * Ensure directory exists
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Clone repo if not exists, otherwise pull latest.
 */
export function cloneRepo(
  repoUrl: string = DEFAULT_REPO_URL,
  repoName: string = DEFAULT_REPO_NAME
): string {
  const repoPath = path.join(REPOS_ROOT, repoName);
  ensureDir(REPOS_ROOT);

  if (!fs.existsSync(repoPath)) {
    console.log(`🔄 Cloning repository ${repoUrl} ...`);
    execSync(`git clone ${repoUrl} ${repoPath}`, { stdio: "inherit" });
  } else {
    console.log(`🔄 Repo found. Pulling latest for ${repoName} ...`);
    execSync(`git -C ${repoPath} pull`, { stdio: "inherit" });
  }

  return repoPath;
}

/**
 * Recursively collect JS/TS files.
 */
function getAllFiles(dirPath: string, collected: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, collected);
    } else if (
      file.endsWith(".js") ||
      file.endsWith(".ts") ||
      file.endsWith(".jsx") ||
      file.endsWith(".tsx")
    ) {
      collected.push(fullPath);
    }
  }

  return collected;
}

/**
 * Read all files in repo.
 */
export function loadRepoFiles(repoPath: string): FileContent[] {
  const allFiles = getAllFiles(repoPath);

  return allFiles.map((filePath) => ({
    filePath,
    content: fs.readFileSync(filePath, "utf-8"),
  }));
}

/**
 * Full pipeline:
 * - Clone/pull
 * - Load files
 */
export async function fetchRepo(
  repoUrl: string = DEFAULT_REPO_URL,
  repoName: string = DEFAULT_REPO_NAME
): Promise<{ repoPath: string; files: FileContent[] }> {
  const repoPath = cloneRepo(repoUrl, repoName);
  const files = loadRepoFiles(repoPath);

  return {
    repoPath,
    files,
  };
}
