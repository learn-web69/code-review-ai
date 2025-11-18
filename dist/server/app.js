// server/app.ts
import express from "express";
import { indexRepositoryFromUrl } from "../services/repo/indexService.js";
import { isRepoIndexed, getRepoMetadata, listAllRepos, deleteRepo, } from "../services/qdrant/indexRepo.js";
import { parseGitHubUrl } from "../services/repo/fetchRepo.js";
import { reviewPRWalkthrough } from "../services/ai/high-level-review.js";
const app = express();
// Middleware
app.use(express.json());
// CORS middleware - must be before routes
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    // Handle preflight requests
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Routes
app.get("/status", async (req, res) => {
    const { repo_url, repo_id } = req.query;
    if (!repo_url && !repo_id) {
        console.log("[API] GET /status - Missing repo_url or repo_id parameter");
        return res.status(400).json({
            error: "repo_url or repo_id is required as query parameter",
            example: "GET /status?repo_url=https://github.com/user/repo",
        });
    }
    try {
        let repoId = repo_id;
        // If repo_url provided, derive repoId from it
        if (repo_url && !repoId) {
            console.log(`[API] GET /status - Extracting repoId from URL: ${repo_url}`);
            const { owner, repo } = parseGitHubUrl(repo_url);
            repoId = `${owner}_${repo}`;
        }
        console.log(`[API] GET /status - Checking index status for repo: ${repoId}`);
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
        }
        else {
            return res.json({
                status: "not_indexed",
                repo_id: repoId,
                repo_url: repo_url || undefined,
                indexed: false,
                message: "Repository is not yet indexed",
            });
        }
    }
    catch (err) {
        console.error(`[API] GET /status - Error:`, err);
        return res.status(500).json({
            error: "Failed to check repository status",
            details: err.message,
        });
    }
});
app.get("/repos", async (req, res) => {
    try {
        console.log("[API] GET /repos - Listing all indexed repositories");
        const repos = await listAllRepos();
        return res.json({
            status: "success",
            count: repos.length,
            repositories: repos,
        });
    }
    catch (err) {
        console.error(`[API] GET /repos - Error:`, err);
        return res.status(500).json({
            error: "Failed to list repositories",
            details: err.message,
        });
    }
});
app.delete("/repository", async (req, res) => {
    const { repo_url, repo_id } = req.query;
    if (!repo_url && !repo_id) {
        console.log("[API] DELETE /repository - Missing repo_url or repo_id parameter");
        return res.status(400).json({
            error: "repo_url or repo_id is required as query parameter",
            example: "DELETE /repository?repo_url=https://github.com/user/repo",
        });
    }
    try {
        let repoId = repo_id;
        // If repo_url provided, derive repoId from it
        if (repo_url && !repoId) {
            console.log(`[API] DELETE /repository - Extracting repoId from URL: ${repo_url}`);
            const { owner, repo } = parseGitHubUrl(repo_url);
            repoId = `${owner}_${repo}`;
        }
        console.log(`[API] DELETE /repository - Deleting repository: ${repoId}`);
        await deleteRepo(repoId);
        return res.json({
            status: "success",
            repo_id: repoId,
            message: "Repository deleted successfully",
        });
    }
    catch (err) {
        console.error(`[API] DELETE /repository - Error:`, err);
        return res.status(500).json({
            error: "Failed to delete repository",
            details: err.message,
        });
    }
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
    const { owner, repo } = parseGitHubUrl(repo_url);
    const repoId = `${owner}_${repo}`;
    console.log(`[API] POST /init-repository - Initializing repository: ${repo_url}`);
    try {
        // Check if already indexed
        const alreadyIndexed = await isRepoIndexed(repoId);
        if (alreadyIndexed) {
            console.log(`[API] Repository ${repoId} already indexed, skipping`);
            return res.json({
                status: "success",
                repo_url,
                repo_id: repoId,
                message: "Repository already indexed",
                already_indexed: true,
            });
        }
        // Index synchronously - user waits for completion
        console.log(`[API] Starting indexing for ${repo_url}...`);
        const result = await indexRepositoryFromUrl(repo_url);
        console.log(`[API] Indexing completed for ${repo_url}:`, result);
        return res.json({
            status: "success",
            repo_url,
            repo_id: repoId,
            message: "Repository indexed successfully",
            result,
        });
    }
    catch (err) {
        console.error(`[API] Indexing failed for ${repo_url}:`, err);
        return res.status(500).json({
            error: "Failed to index repository",
            details: err.message,
        });
    }
});
app.post("/review-pr", async (req, res) => {
    const { pr_url } = req.body || {};
    if (!pr_url) {
        console.log("[API] POST /review-pr - Missing pr_url in body");
        return res.status(400).json({
            error: "pr_url is required in request body",
            example: {
                pr_url: "https://github.com/owner/repo/pull/123",
            },
        });
    }
    console.log(`[API] POST /review-pr - Starting PR review for: ${pr_url}`);
    try {
        // Wait for review to complete
        const review = await reviewPRWalkthrough(pr_url);
        console.log(`[API] PR review completed for ${pr_url}: ${review.length} steps identified`);
        return res.json({
            status: "success",
            pr_url,
            steps_count: review.length,
            steps: review,
        });
    }
    catch (err) {
        console.error(`[API] POST /review-pr - Error:`, err);
        return res.status(500).json({
            error: "Failed to review PR",
            details: err.message,
        });
    }
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
