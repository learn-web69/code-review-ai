#!/bin/bash

# Test script for /init-repository endpoint
# Tests the repository indexing workflow

echo "🧪 Testing /init-repository endpoint"
echo "======================================"

# Configuration
API_URL="http://localhost:3000"
ENDPOINT="/init-repository"
TEST_REPO="https://github.com/learn-web69/code-review-ai"

echo "📍 Target API: ${API_URL}${ENDPOINT}"
echo "📦 Test Repository: ${TEST_REPO}"
echo ""

# Check if server is running
echo "🔍 Checking if server is running..."
if ! curl -s "${API_URL}/status" > /dev/null 2>&1; then
  echo "❌ Server is not running at ${API_URL}"
  echo "💡 Start the server first with: npm run server"
  exit 1
fi
echo "✅ Server is running"
echo ""

# Send request
echo "📤 Sending request to initialize repository..."
echo "Request body:"
echo '{
  "repo_url": "'${TEST_REPO}'"
}'
echo ""

RESPONSE=$(curl -s -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "'${TEST_REPO}'"
  }')

echo "📥 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract status code
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "'${TEST_REPO}'"
  }')

echo "HTTP Status Code: $HTTP_CODE"
if [ "$HTTP_CODE" == "202" ]; then
  echo "✅ Correct response code (202 Accepted)"
else
  echo "❌ Expected 202, got $HTTP_CODE"
  exit 1
fi

echo ""
echo "✅ Test completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Monitor the server logs to see indexing progress"
echo "  2. Wait for indexing to complete"
echo "  3. Use /status endpoint to check index status"
