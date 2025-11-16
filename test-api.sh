#!/bin/bash
# API Testing Script - Quick reference for testing all endpoints

BASE_URL="http://localhost:3000"

echo "🧪 Code Review AI - API Testing"
echo "================================"
echo ""

# Test 1: Status Check
echo "1️⃣  Testing GET /status"
echo "Command: curl -s $BASE_URL/status | jq ."
curl -s "$BASE_URL/status" | jq .
echo ""

# Test 2: Initialize Repository
echo "2️⃣  Testing POST /init-repository/:repo_id"
echo "Command: curl -X POST $BASE_URL/init-repository/test-repo -H 'Content-Type: application/json' -d '{...}'"
curl -s -X POST "$BASE_URL/init-repository/test-repo" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/learn-web69/wikitok",
    "branch": "main"
  }' | jq .
echo ""

# Test 3: Review PR
echo "3️⃣  Testing POST /review-pr/:pr_number"
echo "Command: curl -X POST $BASE_URL/review-pr/42 -H 'Content-Type: application/json' -d '{...}'"
curl -s -X POST "$BASE_URL/review-pr/42" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "test-repo",
    "owner": "learn-web69",
    "repo": "wikitok"
  }' | jq .
echo ""

# Test 4: Live Code Review Tool
echo "4️⃣  Testing POST /tools/review"
echo "Command: curl -X POST $BASE_URL/tools/review -H 'Content-Type: application/json' -d '{...}'"
curl -s -X POST "$BASE_URL/tools/review" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "test-repo",
    "code": "const calculateSum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);",
    "question": "Explain what this function does"
  }' | jq .
echo ""

# Test 5: 404 Error
echo "5️⃣  Testing 404 Error"
echo "Command: curl -s $BASE_URL/unknown-endpoint | jq ."
curl -s "$BASE_URL/unknown-endpoint" | jq .
echo ""

echo "✅ All tests completed!"
