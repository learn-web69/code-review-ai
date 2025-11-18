// server/routes/toolsReview.ts
import { Router, Request, Response } from "express";
import { answerCodeQuestion } from "../../services/ai/contextualReview.js";
import type { ToolsReviewRequest } from "../types.js";

const router = Router();

/**
 * POST /tools/review
 *
 * Handle questions about specific code in a GitHub PR review context.
 * The AI can understand the text, line, and file being asked about.
 * Uses QDrant to find related context (e.g., function definitions).
 *
 * Request body:
 * - repo_id: Repository identifier (owner_repo format)
 * - file?: File path in the PR
 * - line?: Specific line number or range (e.g., "42" or "42-45")
 * - code?: Code snippet being asked about
 * - question: The user's question
 * - walkthrough?: Previously generated AI walkthrough steps for additional context
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      repo_id,
      file,
      line,
      code,
      question,
      walkthrough,
    }: ToolsReviewRequest = req.body;

    // Validate required fields
    if (!question) {
      console.log("[API] POST /tools/review - Missing question");
      return res.status(400).json({
        error: "question is required in request body",
        example: {
          repo_id: "owner_repo",
          question: "What does this function do?",
          code: "function example() { ... }",
        },
      });
    }

    if (!repo_id) {
      console.log("[API] POST /tools/review - Missing repo_id");
      return res.status(400).json({
        error: "repo_id is required in request body",
        example: {
          repo_id: "owner_repo",
          question: "What does this function do?",
        },
      });
    }

    console.log("[API] POST /tools/review - Processing question");
    console.log(`  - Repo ID: ${repo_id}`);
    console.log(`  - File: ${file || "not specified"}`);
    console.log(`  - Line: ${line || "not specified"}`);
    console.log(`  - Question: ${question}`);
    console.log(`  - Code provided: ${!!code}`);
    console.log(
      `  - Walkthrough context: ${
        walkthrough ? walkthrough.length + " steps" : "not provided"
      }`
    );

    // Call the service to answer the question
    const answer = await answerCodeQuestion({
      repoId: repo_id,
      file,
      line,
      code,
      question,
      walkthrough,
    });

    console.log(
      `[API] POST /tools/review - Successfully answered question for ${repo_id}`
    );

    return res.json({
      status: "success",
      answer: answer.answer,
      relatedContext: answer.relatedContext,
      confidence: answer.confidence,
      sources: answer.sources,
    });
  } catch (err) {
    console.error("[API] POST /tools/review - Error:", err);
    return res.status(500).json({
      error: "Failed to answer question",
      details: (err as Error).message,
    });
  }
});

export default router;
