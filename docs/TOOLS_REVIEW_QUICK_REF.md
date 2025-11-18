# Tools Review - Quick Reference

## Endpoint

```
POST http://localhost:3000/tools/review
```

## Request Body

```typescript
{
  repo_id: string;          // Required: "owner_repo"
  question: string;         // Required: Your question
  file?: string;            // Optional: "path/to/file.ts"
  line?: string;            // Optional: "42" or "42-45"
  code?: string;            // Optional: Code snippet
  walkthrough?: Array<{     // Optional: PR context
    file: string;
    chunkName: string;
    chunkType: string;
    explanation: string;
  }>;
}
```

## Response

```typescript
{
  status: "success" | "error";
  answer: string;
  relatedContext: Array<{
    file: string;
    chunk: string;
    chunkName?: string;
    chunkType?: string;
    relevanceScore?: number;
  }>;
  confidence: "high" | "medium" | "low";
  sources: string[];
}
```

## Common Use Cases

### 1. Ask About Selected Code
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "owner_repo",
    "file": "src/auth.ts",
    "line": "23",
    "code": "await validateToken(token)",
    "question": "What does validateToken do?"
  }'
```

### 2. General Question (No Code)
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "owner_repo",
    "question": "How is authentication handled?"
  }'
```

### 3. Question About Function
```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "owner_repo",
    "file": "src/utils.ts",
    "question": "Where is this function defined?",
    "code": "formatDate(timestamp)"
  }'
```

## Prerequisites

1. Repository must be indexed:
   ```bash
   curl -X POST http://localhost:3000/init-repository \
     -H "Content-Type: application/json" \
     -d '{"repo_url": "https://github.com/owner/repo"}'
   ```

2. Environment variables set:
   - `GEMINI_API_KEY`
   - `QDRANT_URL`
   - `QDRANT_API_KEY`

## Response Examples

### High Confidence Answer
```json
{
  "status": "success",
  "answer": "The validateToken function verifies JWT tokens...",
  "relatedContext": [
    {
      "file": "src/auth/jwt.ts",
      "chunk": "export function validateToken(token: string) {...}",
      "chunkName": "validateToken",
      "chunkType": "function",
      "relevanceScore": 0.92
    }
  ],
  "confidence": "high",
  "sources": ["src/auth/jwt.ts"]
}
```

### Error Response
```json
{
  "error": "question is required in request body",
  "example": {
    "repo_id": "owner_repo",
    "question": "What does this function do?"
  }
}
```

## Integration Tips

### JavaScript/TypeScript
```typescript
const response = await fetch('http://localhost:3000/tools/review', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repo_id: 'owner_repo',
    question: 'Your question here',
    code: selectedCode,
  }),
});

const result = await response.json();
console.log(result.answer);
```

### React Hook
```typescript
function useCodeQuestion() {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);

  const ask = async (question, context) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/tools/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, question }),
      });
      const result = await response.json();
      setAnswer(result);
    } finally {
      setLoading(false);
    }
  };

  return { ask, loading, answer };
}
```

## Troubleshooting

### "Repository not indexed"
Run: `curl -X POST http://localhost:3000/init-repository -d '{"repo_url":"..."}'`

### "Cannot find module"
Run: `npm run build` to rebuild TypeScript files

### Slow responses
- Normal: 2-4 seconds
- Check QDrant connection
- Check Gemini API limits

## Testing

```bash
# Run test script
./test-tools-review.sh

# Or test manually
npm run server:dev

# Then in another terminal:
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id":"test","question":"test"}'
```

## More Documentation

- Full docs: `docs/TOOLS_REVIEW_ENDPOINT.md`
- Implementation: `docs/TOOLS_REVIEW_IMPLEMENTATION.md`
- Browser example: `examples/browser-extension-integration.js`
