# Code Review AI - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                       │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Frontend   │  │   Gemini AI  │  │  CLI Tools   │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HTTP API (Express.js)                         │
│                     (localhost:3000)                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GET  /status                                            │  │
│  │  POST /init-repository/:repo_id                          │  │
│  │  POST /review-pr/:pr_number                              │  │
│  │  POST /tools/review                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  src/server/                                                     │
│  ├── index.ts        (Server entry point)                       │
│  ├── app.ts          (Express app & endpoints)                  │
│  └── types.ts        (TypeScript types)                         │
└──────────┬──────────────────┬──────────────────┬─────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
    ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
    │  Repository    │ │      AI        │ │    Vector DB   │
    │   Services     │ │   Services     │ │  (Qdrant)      │
    │                │ │                │ │                │
    │ fetchRepo      │ │ embeddings     │ │ indexRepo      │
    │ fetchPR        │ │ review         │ │ retrieve       │
    └────────────────┘ └────────────────┘ └────────────────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                    ┌─────────▼────────────┐
                    │  Internal Services   │
                    │                      │
                    │ semanticDiff         │
                    │ chunkFile            │
                    │ isConfigFile         │
                    │ chunkArray           │
                    │ buildContext         │
                    │ extractChangedBlocks │
                    └──────────────────────┘
```

## Request Flow Examples

### 1. Initialize Repository

```
Client Request
    │
    ▼
POST /init-repository/:repo_id
    │
    ├─ Log request parameters
    │
    └─ TODO:
       ├─ Validate repo_id & repo_url
       ├─ fetchRepo() → Clone repository
       ├─ chunkFile() → Extract semantic chunks
       ├─ embeddings() → Generate embeddings
       ├─ indexRepo() → Store in Qdrant
       └─ Update metadata storage
    │
    ▼
Response: 202 Accepted
```

### 2. Review Pull Request

```
Client Request (PR #42)
    │
    ▼
POST /review-pr/:pr_number
    │
    ├─ Log request parameters
    │
    └─ TODO:
       ├─ fetchPR() → Get changed files
       ├─ semanticDiff() → Extract diff chunks
       ├─ For each chunk:
       │  ├─ embeddings() → Generate embedding
       │  ├─ retrieve() → Query Qdrant for context
       │  └─ generateBatchReviews() → Generate AI review
       └─ Format results as structured steps
    │
    ▼
Response: 202 Accepted
```

### 3. Live Code Analysis (Tool Use)

```
Gemini AI Request
    │
    ▼
POST /tools/review
    │
    ├─ Log request (code, question, context)
    │
    └─ TODO:
       ├─ embeddings() → Generate embedding
       ├─ retrieve() → Query Qdrant for context
       ├─ generateBatchReviews() → Get explanation
       └─ Format for Gemini tool-use
    │
    ▼
Response: JSON analysis
    │
    ▼
Gemini AI continues with response
```

## Data Flow

```
Repository Indexing Flow:
┌────────────────┐
│   Repository   │
│   (Git URL)    │
└────────┬───────┘
         │
         ▼
    ┌────────┐
    │ Clone  │
    │  Repo  │
    └────┬───┘
         │
         ▼
    ┌──────────────┐
    │  Extract     │
    │  Code Chunks │
    └────┬─────────┘
         │
         ▼
    ┌─────────────┐
    │  Generate   │
    │  Embeddings │
    └────┬────────┘
         │
         ▼
    ┌──────────┐
    │  Qdrant  │
    │  Vector  │
    │   DB     │
    └──────────┘
```

## API Endpoint Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                      Express Router                              │
├─────────────────────────────────────────────────────────────────┤
│ Method │ Path                    │ Handler                       │
├────────┼─────────────────────────┼───────────────────────────────┤
│ GET    │ /status                 │ Check index status            │
│ POST   │ /init-repository/:id    │ Initialize repository         │
│ POST   │ /review-pr/:number      │ Review pull request           │
│ POST   │ /tools/review           │ Live code analysis            │
│ ANY    │ 404 default             │ Return 404 JSON               │
│ ANY    │ Error                   │ Return error JSON             │
└────────┴─────────────────────────┴───────────────────────────────┘
```

## File Organization

```
src/
├── server/                          ← NEW API SERVER
│   ├── index.ts                     ← Startup & shutdown
│   ├── app.ts                       ← Express & endpoints
│   ├── types.ts                     ← TypeScript types
│   └── README.md                    ← Server docs
│
├── services/                        ← EXISTING SERVICES
│   ├── ai/
│   │   ├── embeddings.ts           ← Embedding generation
│   │   └── review.ts               ← Gemini integration
│   ├── qdrant/
│   │   ├── indexRepo.ts            ← Vector storage
│   │   └── retrieve.ts             ← Vector retrieval
│   ├── diff/
│   │   ├── semanticDiff.ts         ← Semantic analysis
│   │   └── buildContext.ts         ← Context building
│   └── repo/
│       ├── fetchRepo.ts            ← Repository cloning
│       └── fetchPR.ts              ← PR file fetching
│
└── helpers/                         ← EXISTING HELPERS
    ├── chunkFile.ts                ← Code chunking
    ├── chunkArray.ts               ← Array chunking
    ├── isConfigFile.ts             ← Config file detection
    └── extractChangedBlocks.ts     ← Extract changes
```

## Technology Stack

```
┌────────────────────────────────────┐
│        Node.js 22.15.1             │
├────────────────────────────────────┤
│        TypeScript 5.3.3            │
├────────────────────────────────────┤
│        Express 5.1.0               │
├────────────────────────────────────┤
│                                    │
│  Existing Services:                │
│  ├─ Google Gemini API              │
│  ├─ Qdrant Vector DB               │
│  ├─ GitHub API (@octokit/rest)     │
│  └─ diff2html                      │
└────────────────────────────────────┘
```

## Response Status Codes

```
┌───────────────────────────────────────┐
│  Endpoint Status Codes                 │
├───────────────────────────────────────┤
│ 200 OK       → GET /status             │
│              → POST /tools/review      │
│              → Successful responses    │
├───────────────────────────────────────┤
│ 202 Accepted → POST /init-repository   │
│              → POST /review-pr         │
│              → Async operations        │
├───────────────────────────────────────┤
│ 400 Bad Req  → Invalid request body    │
│              → Missing parameters      │
├───────────────────────────────────────┤
│ 404 Not Fnd  → Unknown endpoint        │
│              → Unknown resource        │
├───────────────────────────────────────┤
│ 500 Server   → Unhandled errors        │
│              → Service failures        │
└───────────────────────────────────────┘
```

## Logging Flow

```
Request arrives
    │
    ▼
Middleware logs: [timestamp] METHOD /path
    │
    ▼
Handler logs: [API] METHOD /path - Description
    │
    ▼
Handler logs: Parameter details
    │
    ▼
Process data (TODOs)
    │
    ▼
Send response
    │
    ▼
Client receives + processes
```

## Deployment Topology

```
┌─────────────────────────────┐
│     Client Layer            │
│  (Web, Mobile, CLI, AI)     │
└────────────┬────────────────┘
             │
        HTTP/HTTPS
             │
             ▼
┌─────────────────────────────┐
│   API Server (localhost)    │
│   Express.js on port 3000   │
│  src/server/index.ts        │
└────────────┬────────────────┘
             │
        Internal Services
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌─────────┐ ┌──────┐ ┌────────┐
│ GitHub  │ │Gemini│ │Qdrant  │
│   API   │ │  API │ │ Vector │
└─────────┘ └──────┘ └────────┘
```

This architecture allows for:

- ✅ Scalable API design
- ✅ Clear separation of concerns
- ✅ Easy service integration
- ✅ Testable components
- ✅ Future expansion
