# Code Review AI

An AI-powered code review system with semantic analysis and retrieval-augmented generation (RAG).

## 🚀 Quick Start

```bash
# Start the API server
npm run server

# Test the endpoints
bash test-api.sh
```

The server runs on `http://localhost:3000`

## 🌐 Deploy to Vercel (Free!)

Deploy your API in 5 minutes with **zero cost**:

```bash
# 1. Push to GitHub (if not already)
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to https://vercel.com
# 3. Import your GitHub repo
# 4. Add environment variables
# 5. Click Deploy!
```

👉 **[Full Deployment Guide →](docs/DEPLOYMENT.md)**

Your API will be live at: `https://code-review-ai-xxxxx.vercel.app`

- **GET `/status`** - Check repository indexing status
- **POST `/init-repository/:repo_id`** - Initialize and index a repository
- **POST `/review-pr/:pr_number`** - Perform AI-powered PR review
- **POST `/tools/review`** - Live code analysis tool

## 📚 Documentation

All documentation is in the `/docs` folder:

| Document                                                     | Purpose                     |
| ------------------------------------------------------------ | --------------------------- |
| **[Getting Started](docs/GETTING_STARTED.md)**               | 3-step quick start guide    |
| **[Documentation Index](docs/DOCUMENTATION_INDEX.md)**       | Master navigation guide     |
| **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** | What was built              |
| **[API Documentation](docs/API_DOCUMENTATION.md)**           | Complete endpoint reference |
| **[Setup Guide](docs/SETUP_GUIDE.md)**                       | Implementation roadmap      |
| **[Architecture](docs/ARCHITECTURE.md)**                     | System design & diagrams    |
| **[Quick Reference](docs/QUICK_REFERENCE.md)**               | Quick commands & examples   |
| **[Checklist](docs/CHECKLIST.md)**                           | Implementation tracking     |

### Where to Start?

**First time?** → Read [Getting Started](docs/GETTING_STARTED.md)

**Need to navigate?** → Read [Documentation Index](docs/DOCUMENTATION_INDEX.md)

**Want quick commands?** → Read [Quick Reference](docs/QUICK_REFERENCE.md)

**Ready to implement?** → Follow [Setup Guide](docs/SETUP_GUIDE.md)

## 📦 Project Structure

```
├── src/
│   ├── server/              # HTTP API server
│   │   ├── index.ts
│   │   ├── app.ts
│   │   └── types.ts
│   ├── services/            # Existing services
│   └── helpers/             # Utilities
├── docs/                    # All documentation
├── examples/                # Example code
├── test-api.sh             # Test script
└── package.json
```

## ✅ Features

- ✅ Express.js HTTP API with 4 endpoints
- ✅ TypeScript with strict mode
- ✅ Request logging & error handling
- ✅ Graceful shutdown support
- ✅ Comprehensive documentation
- ✅ Automated testing script
- ✅ Example client code

## 🔧 Setup

### Requirements

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_key
QDRANT_API_KEY=your_qdrant_key
QDRANT_URL=your_qdrant_url
PORT=3000
```

## 📖 Available npm Scripts

```bash
npm run server        # Start API server
npm run type-check    # Check TypeScript
npm run build         # Build TypeScript
npm run demo          # Run demo
npm run index         # Index repository
```

## 🧪 Testing

```bash
# Run automated tests
bash test-api.sh

# Or test manually
curl http://localhost:3000/status
```

## 📞 Support

For help, refer to:

- **[Getting Started](docs/GETTING_STARTED.md)** - Overview
- **[Documentation Index](docs/DOCUMENTATION_INDEX.md)** - Find what you need
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Endpoint details
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Implementation steps

## 📝 Next Steps

1. Read the [Getting Started](docs/GETTING_STARTED.md) guide
2. Start the server with `npm run server`
3. Test endpoints with `bash test-api.sh`
4. Follow the [Setup Guide](docs/SETUP_GUIDE.md) to implement features

## 📄 License

ISC

---

**Happy coding! 🚀**
