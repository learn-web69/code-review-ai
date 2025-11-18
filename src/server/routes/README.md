# Server Routes

This directory contains modular route handlers for the API endpoints.

## Structure

```
routes/
├── toolsReview.ts    # /tools/review endpoint - AI-powered code Q&A
└── README.md         # This file
```

## Route Modules

### toolsReview.ts

Handles the `/tools/review` endpoint for contextual code question answering.

**Functionality:**

- Accepts questions about specific code in PR reviews
- Uses QDrant vector search to find related code context
- Generates AI-powered answers using Gemini
- Supports optional PR walkthrough context

**Path:** `POST /tools/review`

**Key Features:**

- Request validation
- Repository-scoped context search
- Confidence scoring
- Related code chunk retrieval

See [TOOLS_REVIEW_ENDPOINT.md](../../docs/TOOLS_REVIEW_ENDPOINT.md) for detailed documentation.

## Adding New Routes

To add a new route module:

1. Create a new file in this directory (e.g., `newRoute.ts`)
2. Export an Express Router:

   ```typescript
   import { Router } from "express";

   const router = Router();

   router.post("/", async (req, res) => {
     // Handle request
   });

   export default router;
   ```

3. Mount the router in `app.ts`:
   ```typescript
   import newRouter from "./routes/newRoute.js";
   app.use("/path", newRouter);
   ```

## Best Practices

- Keep route handlers thin - delegate business logic to services
- Use TypeScript types from `../types.ts`
- Include proper error handling
- Log requests for debugging
- Validate input before processing
- Return consistent response formats
