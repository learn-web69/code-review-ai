/**
 * TypeScript API Client for Code Review AI - Tools Review Endpoint
 * 
 * This client provides a type-safe interface for interacting with the
 * /tools/review endpoint. It can be used in browser extensions, web apps,
 * or Node.js applications.
 */

// ============================================================================
// Types
// ============================================================================

export interface ReviewStep {
  file: string;
  chunkName: string;
  chunkType: string;
  explanation: string;
}

export interface ToolsReviewRequest {
  repo_id: string;
  question: string;
  file?: string;
  line?: string;
  code?: string;
  walkthrough?: ReviewStep[];
}

export interface ContextItem {
  file: string;
  chunk: string;
  chunkName?: string;
  chunkType?: string;
  relevanceScore?: number;
}

export interface ToolsReviewResponse {
  status: "success" | "error";
  answer: string;
  relatedContext: ContextItem[];
  confidence: "high" | "medium" | "low";
  sources: string[];
}

export interface ErrorResponse {
  error: string;
  details?: string;
  example?: Record<string, unknown>;
}

// ============================================================================
// Client Configuration
// ============================================================================

export interface CodeReviewClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  onError?: (error: Error) => void;
  onRequest?: (request: ToolsReviewRequest) => void;
  onResponse?: (response: ToolsReviewResponse) => void;
}

const DEFAULT_CONFIG: Required<CodeReviewClientConfig> = {
  baseUrl: "http://localhost:3000",
  timeout: 30000, // 30 seconds
  headers: {},
  onError: (error) => console.error("CodeReviewClient Error:", error),
  onRequest: () => {},
  onResponse: () => {},
};

// ============================================================================
// Main Client Class
// ============================================================================

export class CodeReviewClient {
  private config: Required<CodeReviewClientConfig>;

  constructor(config: CodeReviewClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Ask a question about code in a PR review
   */
  async askQuestion(
    request: ToolsReviewRequest
  ): Promise<ToolsReviewResponse> {
    this.config.onRequest(request);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(`${this.config.baseUrl}/tools/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config.headers,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse;
        throw new CodeReviewError(
          errorData.error || "Request failed",
          response.status,
          errorData
        );
      }

      const result = (await response.json()) as ToolsReviewResponse;
      this.config.onResponse(result);

      return result;
    } catch (error) {
      if (error instanceof CodeReviewError) {
        this.config.onError(error);
        throw error;
      }

      const wrappedError = new CodeReviewError(
        `Failed to ask question: ${(error as Error).message}`,
        0,
        { error: (error as Error).message }
      );
      this.config.onError(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Ask a simple question (minimal context)
   */
  async ask(
    repoId: string,
    question: string
  ): Promise<ToolsReviewResponse> {
    return this.askQuestion({ repo_id: repoId, question });
  }

  /**
   * Ask about specific code
   */
  async askAboutCode(
    repoId: string,
    question: string,
    code: string,
    file?: string,
    line?: string
  ): Promise<ToolsReviewResponse> {
    return this.askQuestion({
      repo_id: repoId,
      question,
      code,
      file,
      line,
    });
  }

  /**
   * Ask with full context including walkthrough
   */
  async askWithContext(
    repoId: string,
    question: string,
    options: {
      code?: string;
      file?: string;
      line?: string;
      walkthrough?: ReviewStep[];
    }
  ): Promise<ToolsReviewResponse> {
    return this.askQuestion({
      repo_id: repoId,
      question,
      ...options,
    });
  }

  /**
   * Check if repository is indexed
   */
  async isRepositoryIndexed(repoId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/status?repo_id=${repoId}`
      );
      const data = await response.json();
      return data.indexed === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize (index) a repository
   */
  async indexRepository(repoUrl: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/init-repository`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.config.headers,
      },
      body: JSON.stringify({ repo_url: repoUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to index repository");
    }
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class CodeReviewError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "CodeReviewError";
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Basic usage
 */
async function example1() {
  const client = new CodeReviewClient({
    baseUrl: "http://localhost:3000",
  });

  const result = await client.ask(
    "facebook_react",
    "How does React's reconciliation work?"
  );

  console.log("Answer:", result.answer);
  console.log("Confidence:", result.confidence);
  console.log("Sources:", result.sources);
}

/**
 * Example 2: Ask about specific code
 */
async function example2() {
  const client = new CodeReviewClient();

  const result = await client.askAboutCode(
    "facebook_react",
    "What does this hook do?",
    "const [state, setState] = useState(0);",
    "src/components/Counter.tsx",
    "23"
  );

  console.log(result.answer);
}

/**
 * Example 3: Full context with walkthrough
 */
async function example3() {
  const client = new CodeReviewClient();

  const result = await client.askWithContext(
    "facebook_react",
    "Why was this refactored?",
    {
      file: "src/reconciler.ts",
      code: "function reconcile(fiber) {...}",
      walkthrough: [
        {
          file: "src/reconciler.ts",
          chunkName: "reconcile",
          chunkType: "function",
          explanation: "Refactored to use iterative approach",
        },
      ],
    }
  );

  console.log(result.answer);
}

/**
 * Example 4: With error handling and callbacks
 */
async function example4() {
  const client = new CodeReviewClient({
    baseUrl: "http://localhost:3000",
    timeout: 10000,
    onRequest: (req) => {
      console.log("Asking:", req.question);
    },
    onResponse: (res) => {
      console.log(`Answered with ${res.confidence} confidence`);
    },
    onError: (err) => {
      console.error("Error:", err.message);
    },
  });

  try {
    const result = await client.ask(
      "facebook_react",
      "How does useState work?"
    );
    console.log(result.answer);
  } catch (error) {
    if (error instanceof CodeReviewError) {
      console.error("Status:", error.statusCode);
      console.error("Details:", error.details);
    }
  }
}

/**
 * Example 5: React Hook Integration
 */
function useCodeReview(repoId: string) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ToolsReviewResponse | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  const client = React.useMemo(
    () =>
      new CodeReviewClient({
        baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3000",
      }),
    []
  );

  const ask = React.useCallback(
    async (question: string, code?: string, file?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await client.askAboutCode(
          repoId,
          question,
          code || "",
          file
        );
        setResult(response);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [client, repoId]
  );

  return { ask, loading, result, error };
}

/**
 * Example 6: Batch questions
 */
async function example6() {
  const client = new CodeReviewClient();
  const repoId = "facebook_react";

  const questions = [
    "How does useState work?",
    "What is useEffect for?",
    "How does useRef differ from useState?",
  ];

  const results = await Promise.all(
    questions.map((q) => client.ask(repoId, q))
  );

  results.forEach((result, idx) => {
    console.log(`Q${idx + 1}: ${questions[idx]}`);
    console.log(`A${idx + 1}: ${result.answer.substring(0, 100)}...`);
    console.log(`Confidence: ${result.confidence}\n`);
  });
}

/**
 * Example 7: Check if repo is indexed before asking
 */
async function example7() {
  const client = new CodeReviewClient();
  const repoId = "facebook_react";

  const isIndexed = await client.isRepositoryIndexed(repoId);

  if (!isIndexed) {
    console.log("Repository not indexed. Indexing now...");
    await client.indexRepository("https://github.com/facebook/react");
    console.log("Indexing complete!");
  }

  const result = await client.ask(repoId, "How does React rendering work?");
  console.log(result.answer);
}

// ============================================================================
// Export for use in other modules
// ============================================================================

export default CodeReviewClient;
