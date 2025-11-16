// server/app.ts
import express from "express";
import { indexRepositoryFromUrl } from "../services/repo/indexService.js";
const app = express();
// Middleware
app.use(express.json());
// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Routes
app.get("/status", (req, res) => {
    console.log("[API] GET /status - Checking repo index status");
    // TODO: Implement actual status check
    res.json({
        status: "ok",
        indexed: false,
        message: "Status check endpoint - implementation pending",
    });
});
app.post("/init-repository", async (req, res) => {
    const { repo_url } = req.body || {};
    if (!repo_url) {
        console.log("[API] POST /init-repository - Missing repo_url in body");
        return res.status(400).json({
            error: "repo_url is required in request body",
            example: { repo_url: "https://github.com/user/repo" },
        });
    }
    console.log(`[API] POST /init-repository - Initializing repository: ${repo_url}`);
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
app.post("/review-pr/:pr_number", (req, res) => {
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
app.post("/tools/review", (req, res) => {
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
app.use((err, req, res, next) => {
    console.error("[API Error]", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Not found",
        path: req.path,
    });
});
export default app;
