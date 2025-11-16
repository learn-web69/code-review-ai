# Code Review AI Server

Express.js HTTP API for managing AI-powered code reviews with semantic analysis and retrieval-augmented generation (RAG).

## Quick Start

```bash
# Install Express (if not already installed)
npm install express @types/express

# Start the server
npm run server
```

Server runs on `http://localhost:3000`

## Files

```
src/server/
├── index.ts       # Server entry point
├── app.ts         # Express app & endpoints
└── types.ts       # TypeScript type definitions
```

## Endpoints

| Method | Path                        | Description                      |
| ------ | --------------------------- | -------------------------------- |
| GET    | `/status`                   | Check repository index status    |
| POST   | `/init-repository/:repo_id` | Initialize & index a repository  |
| POST   | `/review-pr/:pr_number`     | Perform AI-powered PR review     |
| POST   | `/tools/review`             | Live code analysis (Gemini tool) |

See `API_DOCUMENTATION.md` for complete details.

## Logging

All requests are logged to console:

```
[2025-11-16T14:28:23.469Z] GET /status
[API] GET /status - Checking repo index status
```

## Error Handling

- **400** - Bad request
- **404** - Not found
- **500** - Server error

All errors return JSON:

```json
{
  "error": "Description of what went wrong",
  "path": "/endpoint/path"
}
```

## Type Safety

Request/response types defined in `types.ts`:

- `StatusResponse`
- `InitRepositoryRequest/Response`
- `ReviewPRRequest/Response`
- `ToolsReviewRequest/Response`
- `ErrorResponse`

## Graceful Shutdown

Server handles:

- `SIGTERM` - Kubernetes/container stop signal
- `SIGINT` - Ctrl+C termination

## Implementation Status

✅ **Implemented:**

- HTTP server & routing
- Request logging
- Error handling
- 404 responses
- Graceful shutdown

📝 **TODO:**

- Service integration (see `SETUP_GUIDE.md`)
- Repository metadata storage
- Qdrant vector storage integration
- Gemini API integration

## Usage Example

```bash
# Check status
curl http://localhost:3000/status

# Initialize repository
curl -X POST http://localhost:3000/init-repository/my-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/user/repo"}'

# Review PR
curl -X POST http://localhost:3000/review-pr/42 \
  -H "Content-Type: application/json" \
  -d '{"repo_id": "my-repo", "owner": "user", "repo": "repo"}'
```

See `test-api.sh` for complete test suite.

## Configuration

Environment variables:

- `PORT` - Server port (default: 3000)
- `GITHUB_TOKEN` - For repository access
- `GEMINI_API_KEY` - For AI analysis
- `QDRANT_API_KEY` - For vector storage
- `QDRANT_URL` - Qdrant database URL

See `.env` for setup.

## For Developers

To add new endpoints:

1. Add handler in `src/server/app.ts`
2. Add types in `src/server/types.ts`
3. Log input parameters in handler
4. Implement TODO functionality
5. Return appropriate status code

Example:

```typescript
app.post("/my-endpoint", (req: Request, res: Response) => {
  const { param1, param2 } = req.body;

  console.log("[API] POST /my-endpoint");
  console.log(`  - param1: ${param1}`);

  // TODO: Implement functionality

  res.status(202).json({
    status: "processing",
    message: "Operation started",
  });
});
```

## Next Steps

1. See `SETUP_GUIDE.md` for implementation roadmap
2. See `API_DOCUMENTATION.md` for endpoint specifications
3. Check `examples/api-client-example.ts` for client usage
4. Run `bash test-api.sh` to test endpoints
