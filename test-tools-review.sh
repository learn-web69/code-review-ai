#!/bin/bash

# Test script for /tools/review endpoint
# This demonstrates how the AI can answer questions about code in a PR review context

BASE_URL="http://localhost:3000"

echo "Testing /tools/review endpoint..."
echo ""

# Test 1: Simple question with code snippet
echo "Test 1: Asking about a code snippet"
curl -X POST "$BASE_URL/tools/review" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "learn-web69_wikitok",
    "file": "frontend/src/components/Article.tsx",
    "line": "42",
    "code": "const handleLike = () => {\n  toggleLike(article.pageid);\n};",
    "question": "What does this function do?"
  }'

echo -e "\n\n"

# Test 2: Question without code (AI will search for context)
echo "Test 2: Asking about a function definition"
curl -X POST "$BASE_URL/tools/review" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "learn-web69_wikitok",
    "question": "How does the toggleLike function work?"
  }'

echo -e "\n\n"

# Test 3: Question with walkthrough context
echo "Test 3: Asking with PR walkthrough context"
curl -X POST "$BASE_URL/tools/review" \
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

echo -e "\n\n"
echo "Tests completed!"
