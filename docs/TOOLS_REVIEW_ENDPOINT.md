# Tools Review Endpoint - Documentation

## Overview

The `/tools/review` endpoint enables AI-powered question answering about code in GitHub Pull Request reviews. It understands context about specific lines of code, files, and functions, and uses QDrant vector search to find related code definitions and context to provide comprehensive answers.

## Use Case

When reviewing a PR in the GitHub UI, you can ask questions about:
- What a specific function does
- How a piece of code works
- Why a change was made
- Where a function is defined
- What dependencies a piece of code has

The AI will:
1. Parse your question and code context
2. Search QDrant for related code chunks (function definitions, classes, etc.)
3. Use previously generated PR walkthrough steps if provided
4. Generate a comprehensive answer using Gemini AI

## Endpoint

```
POST /tools/review
```

## Request Format

```typescript
{
  repo_id: string;          // Required: Repository identifier (e.g., "owner_repo")
  file?: string;            // Optional: File path in the PR
  line?: string;            // Optional: Line number or range (e.g., "42" or "42-45")
  code?: string;            // Optional: Code snippet being asked about
  question: string;         // Required: The user's question
  walkthrough?: Array<{     // Optional: Previously generated PR walkthrough steps
    file: string;
    chunkName: string;
    chunkType: string;
    explanation: string;
  }>;
}
```

## Response Format

```typescript
{
  status: "success" | "error";
  answer: string;                    // AI-generated answer
  relatedContext: Array<{            // Related code chunks from QDrant
    file: string;
    chunk: string;
    chunkName?: string;
    chunkType?: string;
    relevanceScore?: number;
  }>;
  confidence: "high" | "medium" | "low";  // AI confidence level
  sources: string[];                 // List of source files referenced
}
```

## Examples

### Example 1: Question about a code snippet

**Request:**
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "learn-web69_wikitok",
    "file": "frontend/src/components/Article.tsx",
    "line": "42",
    "code": "const handleLike = () => {\n  toggleLike(article.pageid);\n};",
    "question": "What does this function do?"
  }'
```

**Response:**
```json
{
  "status": "success",
  "answer": "This is an event handler function that toggles the like status of an article. When called, it invokes the `toggleLike` function with the article's page ID. Based on the related context, `toggleLike` is defined in the LikedArticlesContext and manages the liked articles state in localStorage.",
  "relatedContext": [
    {
      "file": "frontend/src/contexts/LikedArticlesContext.tsx",
      "chunk": "const toggleLike = (pageid: number) => {...}",
      "chunkName": "toggleLike",
      "chunkType": "function",
      "relevanceScore": 0.89
    }
  ],
  "confidence": "high",
  "sources": ["frontend/src/contexts/LikedArticlesContext.tsx"]
}
```

### Example 2: Question without code (searches for context)

**Request:**
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "learn-web69_wikitok",
    "question": "How does the language selection work?"
  }'
```

**Response:**
```json
{
  "status": "success",
  "answer": "The language selection is managed by the LanguageSelector component which renders a dropdown of available languages. When a user selects a language, it updates the state and triggers the useWikiArticles hook to fetch articles in the selected language from the Wikipedia API.",
  "relatedContext": [
    {
      "file": "frontend/src/components/LanguageSelector.tsx",
      "chunkName": "LanguageSelector",
      "chunkType": "function",
      "relevanceScore": 0.85
    },
    {
      "file": "frontend/src/hooks/useWikiArticles.ts",
      "chunkName": "useWikiArticles",
      "chunkType": "function",
      "relevanceScore": 0.78
    }
  ],
  "confidence": "high",
  "sources": [
    "frontend/src/components/LanguageSelector.tsx",
    "frontend/src/hooks/useWikiArticles.ts"
  ]
}
```

### Example 3: Question with PR walkthrough context

**Request:**
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "learn-web69_wikitok",
    "file": "frontend/src/hooks/useWikiArticles.ts",
    "question": "Why was this hook created?",
    "walkthrough": [
      {
        "file": "frontend/src/hooks/useWikiArticles.ts",
        "chunkName": "useWikiArticles",
        "chunkType": "function",
        "explanation": "Custom React hook that fetches Wikipedia articles based on language selection"
      }
    ]
  }'
```

## How It Works

### Architecture

```
User Question
    ↓
Route Handler (routes/toolsReview.ts)
    ↓
Contextual Review Service (services/ai/contextualReview.ts)
    ↓
    ├─→ QDrant Vector Search (find related code)
    │       ↓
    │   Related Context (function definitions, classes, etc.)
    │
    ├─→ Build AI Prompt
    │       ↓
    │   Combines: Question + Code + Related Context + Walkthrough
    │
    └─→ Gemini AI
            ↓
        Generate Answer
```

### Key Components

1. **Route Handler** (`src/server/routes/toolsReview.ts`)
   - Validates incoming requests
   - Calls the contextual review service
   - Returns formatted response

2. **Contextual Review Service** (`src/services/ai/contextualReview.ts`)
   - Builds search query from question and context
   - Searches QDrant for related code chunks
   - Generates comprehensive AI prompt
   - Calls Gemini AI for answer generation
   - Determines confidence level

3. **QDrant Integration**
   - Uses vector embeddings to find semantically similar code
   - Filters by repository ID
   - Returns top 5 most relevant code chunks

4. **AI Prompt Engineering**
   - Includes user's question
   - Adds code snippet if provided
   - Incorporates related context from QDrant
   - Includes PR walkthrough steps if available
   - Instructs AI to reference sources in answer

## Integration with GitHub PR Review UI

To integrate with a browser extension or UI tool:

1. **Capture Context**: When user selects code or clicks on a line
   ```javascript
   const context = {
     repo_id: "owner_repo",
     file: getCurrentFile(),
     line: getSelectedLineNumber(),
     code: getSelectedCode(),
   };
   ```

2. **Send Question**: Make API call with question and context
   ```javascript
   const response = await fetch('http://localhost:3000/tools/review', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       ...context,
       question: userQuestion,
       walkthrough: getPRWalkthroughSteps(), // if available
     }),
   });
   ```

3. **Display Answer**: Show the AI's answer in your UI
   ```javascript
   const result = await response.json();
   displayAnswer(result.answer);
   displayRelatedContext(result.relatedContext);
   ```

## Requirements

- Repository must be indexed in QDrant (use `/init-repository` endpoint first)
- Valid `repo_id` in format `owner_repo`
- At least one of `code` or `question` must provide context
- Environment variables:
  - `GEMINI_API_KEY`: Google Gemini API key
  - `QDRANT_URL`: QDrant instance URL
  - `QDRANT_API_KEY`: QDrant API key

## Error Handling

The endpoint handles various error cases:

- **400 Bad Request**: Missing required fields (`repo_id` or `question`)
- **500 Internal Server Error**: QDrant search failure, AI generation error

Example error response:
```json
{
  "error": "Failed to answer question",
  "details": "QDrant collection not found for repo_id: owner_repo"
}
```

## Performance Considerations

- **QDrant Search**: ~100-300ms depending on collection size
- **Gemini AI**: ~1-3 seconds for answer generation
- **Total Response Time**: ~2-4 seconds typical

## Future Enhancements

Potential improvements:
- Cache frequently asked questions
- Support for multi-file context
- Image/diagram generation for explanations
- Code suggestion capabilities
- Integration with GitHub Copilot
