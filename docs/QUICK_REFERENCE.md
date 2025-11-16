# Quick Reference Card

## 🚀 Start Server

```bash
npm run server
```

## 🧪 Test All Endpoints

```bash
bash test-api.sh
```

## 📡 API Endpoints

### GET /status

```bash
curl http://localhost:3000/status
```

Returns: `{ status, indexed, message }`

### POST /init-repository/:repo_id

```bash
curl -X POST http://localhost:3000/init-repository/my-repo \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/user/repo",
    "branch": "main"
  }'
```

Returns: `{ status: "processing", repo_id, message, steps }`

### POST /review-pr/:pr_number

```bash
curl -X POST http://localhost:3000/review-pr/42 \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "my-repo",
    "owner": "user",
    "repo": "repo"
  }'
```

Returns: `{ status: "processing", pr_number, message, steps }`

### POST /tools/review

```bash
curl -X POST http://localhost:3000/tools/review \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "my-repo",
    "code": "function add(a, b) { return a + b; }",
    "question": "What does this do?"
  }'
```

Returns: `{ status: "success", message, analysis }`

## 📂 Key Files

| File                   | Purpose                 |
| ---------------------- | ----------------------- |
| `src/server/index.ts`  | Server startup          |
| `src/server/app.ts`    | Express app + endpoints |
| `src/server/types.ts`  | TypeScript types        |
| `API_DOCUMENTATION.md` | Full endpoint reference |
| `SETUP_GUIDE.md`       | Implementation guide    |
| `ARCHITECTURE.md`      | System design           |

## 🎯 Implementation TODOs

All in `src/server/app.ts`:

1. **GET /status**: Query Qdrant + metadata storage
2. **POST /init-repository**: Clone → Chunk → Embed → Index
3. **POST /review-pr**: Fetch files → Diff → Embed → Query → Review
4. **POST /tools/review**: Embed → Query → Analyze

## 🔧 Services to Integrate

- `fetchRepo` - Clone repositories
- `fetchPR` - Get PR files
- `chunkFile` - Split code
- `embeddings` - Generate vectors
- `indexRepo` - Store in Qdrant
- `retrieve` - Query from Qdrant
- `generateBatchReviews` - AI analysis
- `semanticDiff` - Extract diffs

## 📊 Status Codes

| Code | Meaning                     |
| ---- | --------------------------- |
| 200  | Success (GET, instant POST) |
| 202  | Processing (async POST)     |
| 404  | Not found                   |
| 500  | Server error                |

## 🐛 Debugging

```bash
# Check server logs
npm run server  # Look at console output

# Check if port is in use
lsof -i :3000

# Kill server if stuck
pkill -f "node.*server"
```

## 📝 TODO Example

In `src/server/app.ts`:

```typescript
// TODO: Implement repository initialization
// 1. Validate repo_id and repo_url
// 2. Clone or update repository
// 3. Extract semantic chunks
// 4. Generate embeddings
// 5. Create Qdrant collection
// 6. Store vectors
// 7. Mark repo as ready
```

Replace TODO with actual implementation.

## 🔐 Environment Variables

```env
GITHUB_TOKEN=your_token
GEMINI_API_KEY=your_key
QDRANT_API_KEY=your_key
QDRANT_URL=your_url
PORT=3000
```

## 📚 Documentation

```
IMPLEMENTATION_SUMMARY.md  ← Start here!
├── API_DOCUMENTATION.md   ← What endpoints do
├── SETUP_GUIDE.md         ← How to implement
├── ARCHITECTURE.md        ← System design
└── CHECKLIST.md           ← Progress tracking
```

## 💡 Tips

- All endpoints log to console for debugging
- Start with `GET /status` - simplest endpoint
- Follow TODO comments in order
- Use existing services - don't rewrite
- TypeScript strict mode for safety
- Check `examples/api-client-example.ts` for patterns

## 🎓 Learning Path

1. Start server: `npm run server`
2. Test endpoints: `bash test-api.sh`
3. Read: `API_DOCUMENTATION.md`
4. Follow: `SETUP_GUIDE.md`
5. Implement: TODO comments in `app.ts`
6. Test: Use curl or `test-api.sh`

## ⚡ Common Commands

```bash
# Start server
npm run server

# Test API
bash test-api.sh

# Type check
npm run type-check

# Build TypeScript
npm run build

# Run demo
npm run demo

# Index repository
npm run index
```

## 🚨 If Something Breaks

1. Check console logs
2. Verify `.env` file exists
3. Kill any hanging processes: `pkill -f node`
4. Restart: `npm run server`
5. Check port availability: `lsof -i :3000`

## ✅ Success Checklist

- [ ] Server starts: `npm run server`
- [ ] Endpoints respond: `bash test-api.sh`
- [ ] Requests logged to console
- [ ] JSON responses valid
- [ ] Errors handled gracefully
- [ ] TypeScript compiles: `npm run type-check`

---

**Need more info?** Check the documentation files listed above!
