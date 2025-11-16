# Code Review AI - Setup & Implementation Guide

## 📋 Summary

You now have a fully functional **Express.js API** that exposes your code review AI module with 4 main endpoints:

1. **GET `/status`** - Check repository indexing status
2. **POST `/init-repository/:repo_id`** - Initialize and index a repository
3. **POST `/review-pr/:pr_number`** - Perform AI-powered PR review
4. **POST `/tools/review`** - Live code analysis tool (for Gemini integration)

## 📁 Project Structure

```
src/
├── server/
│   ├── index.ts        # Server entry point with graceful shutdown
│   └── app.ts          # Express app with all 4 endpoints
├── services/           # Your existing services
│   ├── ai/
│   │   └── review.ts   # AI review logic
│   ├── qdrant/         # Vector database services
│   ├── diff/           # Semantic diff services
│   └── repo/           # Repository services
└── helpers/            # Existing helpers
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install express @types/express
```

### 2. Start the Server

```bash
npm run server
```

Output:

```
🚀 Code Review AI Server running on http://localhost:3000

Available endpoints:
  GET  /status
  POST /init-repository/:repo_id
  POST /review-pr/:pr_number
  POST /tools/review
```

### 3. Test the API

```bash
# Check status
curl http://localhost:3000/status

# Initialize repository
curl -X POST http://localhost:3000/init-repository/my-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/user/repo", "branch": "main"}'

# Review PR
curl -X POST http://localhost:3000/review-pr/42 \
  -H "Content-Type: application/json" \
  -d '{"repo_id": "my-repo", "owner": "user", "repo": "repo"}'

# Live code analysis
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{"repo_id": "my-repo", "code": "function add(a,b) { return a+b; }", "question": "What does this do?"}'
```

Or use the automated test script:

```bash
bash test-api.sh
```

## 🔧 Implementation Roadmap

All endpoints currently return **placeholder responses with console logging**. Here's what to implement next:

### Endpoint: `GET /status`

- [ ] Query Qdrant collection existence
- [ ] Check repository metadata storage
- [ ] Return indexed status for multiple repositories

**Services to use:** Qdrant API, metadata storage

### Endpoint: `POST /init-repository/:repo_id`

- [ ] Validate `repo_id` and `repo_url`
- [ ] Clone/update repository
- [ ] Extract semantic chunks using `chunkFile` helper
- [ ] Generate embeddings using `embeddings` service
- [ ] Create Qdrant collection
- [ ] Store vectors using `indexRepo` service
- [ ] Update metadata with completion status

**Services to use:**

- `services/repo/fetchRepo` - repository cloning
- `helpers/chunkFile` - code chunking
- `services/ai/embeddings` - embedding generation
- `services/qdrant/indexRepo` - vector storage

### Endpoint: `POST /review-pr/:pr_number`

- [ ] Fetch PR changed files using `fetchPR`
- [ ] Extract semantic diff chunks using `semanticDiff`
- [ ] For each chunk:
  - [ ] Generate embedding
  - [ ] Query Qdrant for context using `retrieve`
  - [ ] Generate AI review using `generateBatchReviews`
- [ ] Format results as structured steps
- [ ] Return for UI consumption

**Services to use:**

- `services/repo/fetchPR` - PR file fetching
- `services/diff/semanticDiff` - semantic diff extraction
- `services/ai/embeddings` - embedding generation
- `services/qdrant/retrieve` - context retrieval
- `services/ai/review` - review generation

### Endpoint: `POST /tools/review`

- [ ] Validate input (code, question, or context)
- [ ] Generate embedding of code/question
- [ ] Query Qdrant for context using `retrieve`
- [ ] Fetch related previous review steps
- [ ] Send to Gemini or use `generateBatchReviews`
- [ ] Return short explanation for Gemini tool-use

**Services to use:**

- `services/ai/embeddings` - embedding generation
- `services/qdrant/retrieve` - context retrieval
- `services/ai/review` - review generation

## 📝 Code Templates

Each endpoint has clear TODO comments in `src/server/app.ts` showing what needs to be implemented. For example:

```typescript
app.post("/init-repository/:repo_id", async (req: Request, res: Response) => {
  // TODO: Implement repository initialization
  // 1. Validate repo_id and repo_url
  // 2. Clone or update repository
  // 3. Extract semantic chunks using chunkFile
  // 4. Generate embeddings using embeddings service
  // ... etc
});
```

## 🗄️ Data Storage Needs

Consider implementing:

1. **Repository Metadata Storage** - Track which repos are indexed
   - Repository ID, URL, indexed status, last updated, etc.
2. **Review Steps Storage** - Cache review results
   - PR number, repository, analysis steps, generated at, etc.

Options: Database (MongoDB, PostgreSQL), file-based JSON, or memory store

## 🔌 Environment Setup

Ensure your `.env` file has:

```env
GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_key
QDRANT_API_KEY=your_qdrant_key
QDRANT_URL=your_qdrant_url
PORT=3000  # Optional
```

## 📚 Resources

- **API Documentation**: See `API_DOCUMENTATION.md`
- **Example Client**: See `examples/api-client-example.ts`
- **Test Script**: See `test-api.sh`

## 🛠️ Development Tips

1. **Console Logging**: All endpoints log what they receive for debugging
2. **Error Handling**: 404 and 500 errors are handled with JSON responses
3. **Request Format**: All endpoints accept JSON and return JSON
4. **Status Codes**: Uses appropriate HTTP status codes (200, 202 Accepted, 404, 500)

## 🧪 Testing with curl

Complete test suite example:

```bash
# Start server in one terminal
npm run server

# In another terminal, run tests
bash test-api.sh

# Or use curl individually
curl -X GET http://localhost:3000/status
curl -X POST http://localhost:3000/init-repository/test-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url":"https://github.com/test/repo"}'
```

## 🐛 Debugging

1. All endpoints log to console - check terminal output
2. Server includes graceful shutdown handling (SIGINT, SIGTERM)
3. TypeScript strict mode enabled for type safety
4. ES modules configured for modern imports

## 🎯 Next Steps

1. **Implement metadata storage** for tracking indexed repositories
2. **Connect each endpoint** to the corresponding service functions
3. **Add request validation** using a library like Zod or Joi
4. **Implement async operations** properly (use queues if needed)
5. **Add API authentication** (API keys, JWT, etc.)
6. **Create integration tests** for each endpoint
7. **Deploy** to production environment

## 📞 Support

For issues or questions:

1. Check console logs from the server
2. Review TODO comments in `src/server/app.ts`
3. Refer to existing service implementations
4. Check `API_DOCUMENTATION.md` for endpoint details
