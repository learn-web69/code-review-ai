// Example API Client Usage
// This file demonstrates how to use the Code Review AI API

const API_URL = "http://localhost:3000";

// Helper function to make API requests
async function apiRequest(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  return response.json();
}

// Example 1: Check if repository is indexed
async function checkRepositoryStatus() {
  console.log("Checking repository status...");
  const result = await apiRequest("GET", "/status");
  console.log("Status:", result);
  return result;
}

// Example 2: Initialize a new repository
async function initializeRepository(repoId: string, repoUrl: string) {
  console.log(`Initializing repository: ${repoId}`);
  const result = await apiRequest("POST", `/init-repository/${repoId}`, {
    repo_url: repoUrl,
    branch: "main",
  });
  console.log("Initialization started:", result);
  return result;
}

// Example 3: Review a pull request
async function reviewPullRequest(
  prNumber: number,
  repoId: string,
  owner: string,
  repo: string
) {
  console.log(`Reviewing PR #${prNumber}...`);
  const result = await apiRequest("POST", `/review-pr/${prNumber}`, {
    repo_id: repoId,
    owner,
    repo,
  });
  console.log("PR Review started:", result);
  return result;
}

// Example 4: Get live analysis of code
async function analyzeCode(
  code: string,
  question: string,
  repoId?: string,
  context?: string
) {
  console.log("Analyzing code...");
  const result = await apiRequest("POST", "/tools/review", {
    repo_id: repoId,
    code,
    question,
    context,
  });
  console.log("Analysis result:", result);
  return result;
}

// Example usage
async function main() {
  try {
    // 1. Check status
    await checkRepositoryStatus();

    // 2. Initialize a repository
    await initializeRepository(
      "my-repo",
      "https://github.com/user/my-repo.git"
    );

    // 3. Review a PR
    await reviewPullRequest(42, "my-repo", "user", "my-repo");

    // 4. Analyze code
    await analyzeCode(
      `
      function fibonacci(n: number): number {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
      `,
      "Is this efficient? Can it be optimized?",
      "my-repo"
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

// Uncomment to run:
// main();

export {
  checkRepositoryStatus,
  initializeRepository,
  reviewPullRequest,
  analyzeCode,
};
