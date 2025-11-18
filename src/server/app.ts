// server/app.ts
import express, { Request, Response, NextFunction } from "express";
import { indexRepositoryFromUrl } from "../services/repo/indexService.js";
import {
  isRepoIndexed,
  getRepoMetadata,
  listAllRepos,
} from "../services/qdrant/indexRepo.js";
import { parseGitHubUrl } from "../services/repo/fetchRepo.js";

const app = express();

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/status", async (req: Request, res: Response) => {
  const { repo_url, repo_id } = req.query;

  if (!repo_url && !repo_id) {
    console.log("[API] GET /status - Missing repo_url or repo_id parameter");
    return res.status(400).json({
      error: "repo_url or repo_id is required as query parameter",
      example: "GET /status?repo_url=https://github.com/user/repo",
    });
  }

  try {
    let repoId = repo_id as string;

    // If repo_url provided, derive repoId from it
    if (repo_url && !repoId) {
      console.log(
        `[API] GET /status - Extracting repoId from URL: ${repo_url}`
      );
      const { owner, repo } = parseGitHubUrl(repo_url as string);
      repoId = `${owner}_${repo}`;
    }

    console.log(
      `[API] GET /status - Checking index status for repo: ${repoId}`
    );

    const indexed = await isRepoIndexed(repoId);

    if (indexed) {
      const metadata = await getRepoMetadata(repoId);
      return res.json({
        status: "indexed",
        repo_id: repoId,
        repo_url: repo_url || undefined,
        indexed: true,
        metadata: {
          repoName: metadata?.repoName,
          lastCommit: metadata?.lastCommit,
          chunkCount: metadata?.chunkCount,
          filesIndexed: metadata?.filesIndexed,
          indexedAt: metadata?.indexedAt,
        },
      });
    } else {
      return res.json({
        status: "not_indexed",
        repo_id: repoId,
        repo_url: repo_url || undefined,
        indexed: false,
        message: "Repository is not yet indexed",
      });
    }
  } catch (err) {
    console.error(`[API] GET /status - Error:`, err);
    return res.status(500).json({
      error: "Failed to check repository status",
      details: (err as Error).message,
    });
  }
});

app.get("/repos", async (req: Request, res: Response) => {
  try {
    console.log("[API] GET /repos - Listing all indexed repositories");
    const repos = await listAllRepos();

    return res.json({
      status: "success",
      count: repos.length,
      repositories: repos,
    });
  } catch (err) {
    console.error(`[API] GET /repos - Error:`, err);
    return res.status(500).json({
      error: "Failed to list repositories",
      details: (err as Error).message,
    });
  }
});

app.post("/init-repository", async (req: Request, res: Response) => {
  const { repo_url } = req.body || {};

  if (!repo_url) {
    console.log("[API] POST /init-repository - Missing repo_url in body");
    return res.status(400).json({
      error: "repo_url is required in request body",
      example: { repo_url: "https://github.com/user/repo" },
    });
  }

  console.log(
    `[API] POST /init-repository - Initializing repository: ${repo_url}`
  );

  // Return 202 Accepted immediately
  res.status(202).json({
    status: "processing",
    repo_url,
    message: "Repository initialization started",
  });

  // Start indexing in background (don't await)
  indexRepositoryFromUrl(repo_url)
    .then((result) => {
      console.log(`[API] Indexing completed for ${repo_url}:`, result);
    })
    .catch((err) => {
      console.error(`[API] Indexing failed for ${repo_url}:`, err);
    });
});

app.post("/review-pr/:pr_number", (req: Request, res: Response) => {
  const { pr_number } = req.params;
  const { repo_url, owner, repo } = req.body || {};

  console.log(`[API] POST /review-pr/${pr_number} - Starting PR review`);
  console.log(`  - Repo URL: ${repo_url || "not provided"}`);
  console.log(`  - Owner: ${owner || "not provided"}`);
  console.log(`  - Repo: ${repo || "not provided"}`);

  res.status(202).json({
    status: "processing",
    pr_number: parseInt(pr_number),
    message: "PR review started - full implementation pending",
    steps: [
      "Fetching PR changed files",
      "Extracting semantic-diff chunks",
      "Generating embeddings",
      "Querying Qdrant for context",
      "Generating AI review",
      "Formatting results",
    ],
  });
});

app.post("/tools/review", (req: Request, res: Response) => {
  const { repo_url, code, question, context } = req.body || {};

  console.log("[API] POST /tools/review - Live code analysis requested");
  console.log(`  - Repo URL: ${repo_url || "not provided"}`);
  console.log(`  - Question: ${question || "not provided"}`);
  console.log(`  - Code snippet provided: ${!!code}`);
  console.log(`  - Additional context: ${context || "not provided"}`);

  res.json({
    status: "success",
    message: "Live review tool called - implementation pending",
    analysis: {
      summary: "Placeholder explanation - full implementation pending",
      relatedContext: [],
      previousSteps: [],
    },
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[API Error]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

export default app;
