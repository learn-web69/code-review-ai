# How to Test the /tools/review Endpoint

## Quick Test Methods

### Method 1: Run the Interactive Test Script (Recommended)
```bash
./test-tools-interactive.sh
```
This will run 4 different test scenarios and show you the responses.

### Method 2: Simple curl Command
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "question": "What does the Article component do?"
  }' | jq '.'
```

### Method 3: Step-by-Step Manual Testing

#### Step 1: Check server is running
```bash
curl http://localhost:3000/repos
```

You should see your indexed repositories.

#### Step 2: Test with a simple question
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "question": "How does the useWikiArticles hook work?"
  }' | jq '.'
```

#### Step 3: Test with code snippet
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "file": "frontend/src/components/Article.tsx",
    "code": "const handleLike = () => { toggleLike(article.pageid); }",
    "question": "What does toggleLike do?"
  }' | jq '.'
```

#### Step 4: Test with file and line context
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "learn-web69_code-review-ai",
    "file": "src/services/ai/embeddings.ts",
    "line": "10",
    "question": "What embedding model is used?"
  }' | jq '.'
```

## Available Test Repositories

Based on your indexed repos:

1. **`IsaacGemal_wikitok`** (18 chunks, 14 files)
   - Frontend React app
   - Good for testing React component questions

2. **`learn-web69_code-review-ai`** (45 chunks, 67 files)
   - This project itself!
   - Good for testing service/backend questions

3. **`learn-web69_code-review-ai-extension`** (3 chunks, 22 files)
   - Browser extension
   - Good for testing extension-related questions

## Example Test Questions by Repository

### For `IsaacGemal_wikitok`:
```bash
# About React hooks
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id":"IsaacGemal_wikitok","question":"How does the like functionality work?"}'

# About components
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id":"IsaacGemal_wikitok","question":"What does the WikiCard component display?"}'

# About state management
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id":"IsaacGemal_wikitok","question":"How is article data fetched and stored?"}'
```

### For `learn-web69_code-review-ai`:
```bash
# About services
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id":"learn-web69_code-review-ai","question":"How does the QDrant integration work?"}'

# About embeddings
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id":"learn-web69_code-review-ai","question":"What AI model generates embeddings?"}'

# About the review process
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id":"learn-web69_code-review-ai","question":"How does PR review generation work?"}'
```

## Understanding the Response

A successful response looks like:
```json
{
  "status": "success",
  "answer": "The toggleLike function manages liked articles...",
  "relatedContext": [
    {
      "file": "frontend/src/contexts/LikedArticlesContext.tsx",
      "chunk": "const toggleLike = (pageid: number) => {...}",
      "chunkName": "toggleLike",
      "chunkType": "function",
      "relevanceScore": 0.92
    }
  ],
  "confidence": "high",
  "sources": ["frontend/src/contexts/LikedArticlesContext.tsx"]
}
```

### Key Fields:
- **`answer`**: The AI-generated explanation
- **`relatedContext`**: Code chunks found via QDrant search
- **`confidence`**: How confident the AI is (high/medium/low)
- **`sources`**: Files that were referenced
- **`relevanceScore`**: How similar each context chunk is (0-1)

## Test Different Scenarios

### 1. General Question (No Code)
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "question": "What is this application about?"
  }' | jq '.answer'
```

### 2. Specific Code Question
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "file": "frontend/src/hooks/useWikiArticles.ts",
    "code": "const [articles, setArticles] = useState<Article[]>([]);",
    "question": "What type is Article?"
  }' | jq '.answer'
```

### 3. With Line Number
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "learn-web69_code-review-ai",
    "file": "src/services/qdrant/retrieve.ts",
    "line": "15-25",
    "question": "What does this function return?"
  }' | jq '.answer'
```

### 4. Complex Question with Context
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "question": "How does the app handle different languages?",
    "walkthrough": [
      {
        "file": "frontend/src/components/LanguageSelector.tsx",
        "chunkName": "LanguageSelector",
        "chunkType": "function",
        "explanation": "Component for selecting Wikipedia language"
      }
    ]
  }' | jq '.'
```

## Verify Response Quality

Check these aspects:
1. ✅ **Response time**: Should be 2-4 seconds
2. ✅ **Answer quality**: Should be relevant and detailed
3. ✅ **Related context**: Should include actual code from repo
4. ✅ **Confidence**: Should match the context quality
5. ✅ **Sources**: Should list the relevant files

## Common Test Scenarios

### Test Error Handling
```bash
# Missing question
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id":"IsaacGemal_wikitok"}' | jq '.'

# Missing repo_id
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}' | jq '.'

# Invalid repo_id
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id":"invalid_repo","question":"test"}' | jq '.'
```

## Performance Testing

Time a request:
```bash
time curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "question": "How does the app work?"
  }' > /dev/null 2>&1
```

## View Full Responses

To see the complete response including all related context:
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "question": "What components are in the frontend?"
  }' | jq '.' > response.json

cat response.json
```

## Troubleshooting

### Server not responding
```bash
# Check if server is running
curl http://localhost:3000/repos

# Restart server if needed
npm run server:dev
```

### No related context found
- The repository might not be fully indexed
- Try asking about specific files/functions that you know exist

### Low confidence scores
- Add more context (code snippet, file, line number)
- Ask more specific questions
- Ensure the repository is properly indexed

## Next Steps

1. ✅ Run `./test-tools-interactive.sh` to see it in action
2. ✅ Try your own questions about the indexed repositories
3. ✅ Test with different combinations of context
4. ✅ Check the response quality and confidence scores
5. ✅ Experiment with the browser extension example

## Quick One-Liner Tests

```bash
# Test 1: Simple
curl -s -X POST http://localhost:3000/tools/review -H "Content-Type: application/json" -d '{"repo_id":"IsaacGemal_wikitok","question":"What is the main component?"}' | jq '{answer,confidence}'

# Test 2: With code
curl -s -X POST http://localhost:3000/tools/review -H "Content-Type: application/json" -d '{"repo_id":"IsaacGemal_wikitok","code":"useState","question":"Where is useState used?"}' | jq '{answer,sources}'

# Test 3: Check sources
curl -s -X POST http://localhost:3000/tools/review -H "Content-Type: application/json" -d '{"repo_id":"learn-web69_code-review-ai","question":"How does QDrant work?"}' | jq '.sources'
```

Happy testing! 🚀
