#!/bin/bash

# Interactive Test Script for /tools/review endpoint
# This lets you easily test the endpoint with different scenarios

API_URL="http://localhost:3000/tools/review"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    Testing /tools/review Endpoint${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Simple question about wikitok repository
echo -e "${YELLOW}Test 1: Simple question about React hooks${NC}"
echo -e "${GREEN}Request:${NC}"
cat << 'EOF' | jq '.'
{
  "repo_id": "IsaacGemal_wikitok",
  "question": "How does the useWikiArticles hook work?"
}
EOF

echo ""
echo -e "${GREEN}Response:${NC}"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "question": "How does the useWikiArticles hook work?"
  }' | jq '.'

echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────${NC}"
echo ""

# Test 2: Question with code snippet
echo -e "${YELLOW}Test 2: Question about specific code snippet${NC}"
echo -e "${GREEN}Request:${NC}"
cat << 'EOF' | jq '.'
{
  "repo_id": "IsaacGemal_wikitok",
  "file": "frontend/src/components/Article.tsx",
  "code": "const handleLike = () => { toggleLike(article.pageid); }",
  "question": "What does the toggleLike function do?"
}
EOF

echo ""
echo -e "${GREEN}Response:${NC}"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "file": "frontend/src/components/Article.tsx",
    "code": "const handleLike = () => { toggleLike(article.pageid); }",
    "question": "What does the toggleLike function do?"
  }' | jq '.'

echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────${NC}"
echo ""

# Test 3: Question with file and line context
echo -e "${YELLOW}Test 3: Question with file and line number${NC}"
echo -e "${GREEN}Request:${NC}"
cat << 'EOF' | jq '.'
{
  "repo_id": "IsaacGemal_wikitok",
  "file": "frontend/src/hooks/useWikiArticles.ts",
  "line": "15",
  "question": "What API endpoint is being used here?"
}
EOF

echo ""
echo -e "${GREEN}Response:${NC}"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "file": "frontend/src/hooks/useWikiArticles.ts",
    "line": "15",
    "question": "What API endpoint is being used here?"
  }' | jq '.'

echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────${NC}"
echo ""

# Test 4: Question about code-review-ai itself
echo -e "${YELLOW}Test 4: Question about this project's code${NC}"
echo -e "${GREEN}Request:${NC}"
cat << 'EOF' | jq '.'
{
  "repo_id": "learn-web69_code-review-ai",
  "question": "How does the embeddings service work?"
}
EOF

echo ""
echo -e "${GREEN}Response:${NC}"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "learn-web69_code-review-ai",
    "question": "How does the embeddings service work?"
  }' | jq '.'

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
