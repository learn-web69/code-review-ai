// server/app.ts
import express, { Request, Response, NextFunction } from "express";

const app = express();

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/status", (req: Request, res: Response) => {
  console.log("[API] GET /status - Checking repo index status");
  // TODO: Implement actual status check
  res.json({
    status: "ok",
    indexed: false,
    message: "Status check endpoint - implementation pending",
  });
});

app.post("/init-repository/:repo_id", (req: Request, res: Response) => {
  const { repo_id } = req.params;
  const { repo_url, branch = "main" } = req.body || {};

  console.log(
    `[API] POST /init-repository/${repo_id} - Initializing repository`
  );
  console.log(`  - Repo URL: ${repo_url || "not provided"}`);
  console.log(`  - Branch: ${branch}`);

  res.status(202).json({
    status: "processing",
    repo_id,
    message: "Repository initialization started - full implementation pending",
    steps: [
      "Clone/update repository",
      "Extract semantic chunks",
      "Generate embeddings",
      "Create Qdrant collection",
      "Store vectors",
      "Mark repository as ready",
    ],
  });
});

app.post("/review-pr/:pr_number", (req: Request, res: Response) => {
  const { pr_number } = req.params;
  const { repo_id, owner, repo } = req.body || {};

  console.log(`[API] POST /review-pr/${pr_number} - Starting PR review`);
  console.log(`  - Repo ID: ${repo_id || "not provided"}`);
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
  const { repo_id, code, question, context } = req.body || {};

  console.log("[API] POST /tools/review - Live code analysis requested");
  console.log(`  - Repo ID: ${repo_id || "not provided"}`);
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
