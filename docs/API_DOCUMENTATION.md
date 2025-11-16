# Code Review AI - API Documentation

## Overview

The Code Review AI API provides endpoints to manage repository indexing and perform AI-powered code reviews using semantic analysis and retrieval-augmented generation (RAG).

## Running the Server

```bash
npm run server
```

The server will start on `http://localhost:3000` (or `$PORT` if specified).

## Endpoints

### 1. GET `/status`

Checks whether a repository is already indexed and ready for analysis.

**Response:**

```json
{
  "status": "ok",
  "indexed": false,
  "message": "Status check endpoint - implementation pending"
}
```

**TODO Implementation:**

- Query Qdrant collection existence
- Check repository metadata storage
- Return indexed status for multiple repositories

---

### 2. POST `/init-repository/:repo_id`

Initializes a repository for AI code review. This is the heavy lifting operation that:

- Clones or updates the repository
- Extracts semantic chunks from code files
- Generates embeddings for each chunk
- Creates a Qdrant collection
- Stores vectors with metadata
- Marks the repository as "ready"

**Request:**

```bash
curl -X POST http://localhost:3000/init-repository/my-repo \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/user/repo",
    "branch": "main"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repo_url` | string | No | Git repository URL |
| `branch` | string | No | Branch to index (default: "main") |

**Response (202 Accepted):**

```json
{
  "status": "processing",
  "repo_id": "my-repo",
  "message": "Repository initialization started",
  "steps": [
    "Clone/update repository",
    "Extract semantic chunks",
    "Generate embeddings",
    "Create Qdrant collection",
    "Store vectors",
    "Mark repository as ready"
  ]
}
```

**TODO Implementation:**

- Validate `repo_id` and `repo_url`
- Clone/update repository using git
- Extract semantic chunks using `chunkFile` helper
- Generate embeddings using `embeddings` service
- Create Qdrant collection with appropriate schema
- Store vectors using `indexRepo` service
- Update metadata storage with completion status

---

### 3. POST `/review-pr/:pr_number`

Performs an AI-powered review of a pull request. This endpoint:

- Fetches PR changed files
- Extracts semantic-diff chunks for modified code
- Queries Qdrant for related context (RAG)
- Generates step-by-step explanations
- Returns structured results for UI consumption

**Request:**

```bash
curl -X POST http://localhost:3000/review-pr/42 \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "my-repo",
    "owner": "github-username",
    "repo": "repo-name"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repo_id` | string | No | Repository identifier |
| `owner` | string | No | GitHub repository owner |
| `repo` | string | No | GitHub repository name |

**Response (202 Accepted):**

```json
{
  "status": "processing",
  "pr_number": 42,
  "message": "PR review started",
  "steps": [
    "Fetching PR changed files",
    "Extracting semantic-diff chunks",
    "Generating embeddings",
    "Querying Qdrant for context",
    "Generating AI review",
    "Formatting results"
  ]
}
```

**TODO Implementation:**

- Validate PR number and repository context
- Fetch PR changed files using `fetchPR` service
- Extract semantic diff chunks using `semanticDiff` service
- For each chunk:
  1. Generate embedding
  2. Query Qdrant using `retrieve` service for related context
  3. Generate AI review using `generateBatchReviews`
- Format results as step-by-step explanations
- Return structured steps compatible with UI

---

### 4. POST `/tools/review`

AI Live Review Tool - Called inside Gemini's tool-calling flow to provide context-aware explanations. This endpoint:

- Fetches additional context from Qdrant
- Retrieves related previous review steps
- Analyzes arbitrary code from user queries
- Returns short explanations formatted for Gemini tool-use

**Request:**

```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "my-repo",
    "code": "function add(a, b) { return a + b; }",
    "question": "What does this function do?",
    "context": "This is from the math utilities module"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repo_id` | string | No | Repository identifier |
| `code` | string | No | Code snippet to analyze |
| `question` | string | No | User question about the code |
| `context` | string | No | Additional context |

**Response:**

```json
{
  "status": "success",
  "message": "Live review tool called",
  "analysis": {
    "summary": "Placeholder explanation - full implementation pending",
    "relatedContext": [],
    "previousSteps": []
  }
}
```

**TODO Implementation:**

- Validate input (at least one of: code, question, context)
- Generate embedding of code/question
- Query Qdrant for related context using `retrieve` service
- Fetch related previous review steps from storage
- Send to AI (either `generateBatchReviews` or direct Gemini call)
- Return short explanation formatted for Gemini tool-use
- Format response to be usable as Gemini tool output

---

## Error Handling

The API includes error handling for:

- Invalid request bodies (400)
- Not found errors (404)
- Server errors (500)

**Error Response:**

```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Environment Variables

The API requires the following environment variables (defined in `.env`):

| Variable         | Description                     |
| ---------------- | ------------------------------- |
| `PORT`           | Server port (default: 3000)     |
| `GITHUB_TOKEN`   | GitHub API authentication token |
| `GEMINI_API_KEY` | Google Gemini API key           |
| `QDRANT_API_KEY` | Qdrant database API key         |
| `QDRANT_URL`     | Qdrant database URL             |

---

## Integration with Existing Services

The API is designed to integrate with your existing services:

### Services Used:

- **`services/repo`**: `fetchPR`, `fetchRepo` - Repository and PR data fetching
- **`services/ai`**: `generateBatchReviews` - Gemini-based code analysis
- **`services/qdrant`**: `indexRepo`, `retrieve` - Vector storage and retrieval
- **`services/diff`**: `semanticDiff` - Semantic diff extraction
- **`helpers`**: `chunkFile` - Code file chunking

### Data Flow:

```
Repository Indexing:
  Repo URL → Clone → Chunk → Embed → Qdrant Index

PR Review:
  PR Number → Fetch Files → Semantic Diff → Embed → Qdrant Query → AI Review

Live Tool:
  User Query → Embed → Qdrant Query → AI Analysis → Response
```

---

## Development Notes

### Console Logging

All endpoints include console logging for debugging:

- Timestamp and HTTP method/path
- Endpoint-specific parameters received
- Processing steps

### Placeholder Responses

Currently, all endpoints return placeholder responses with detailed TODO comments in the code. To implement the full functionality, follow the TODO comments in `src/server/app.ts`.

### Next Steps

1. Implement repository metadata storage (database or file-based)
2. Connect each endpoint to the corresponding service functions
3. Add proper error handling and validation
4. Implement request/response types for TypeScript safety
5. Add API authentication if needed
6. Create integration tests for each endpoint
