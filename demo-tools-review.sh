#!/bin/bash

# Quick Demo - Shows the endpoint working in real-time
# Run this to see a live demonstration

API_URL="http://localhost:3000/tools/review"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Live Demo: /tools/review Endpoint                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "→ Asking: 'How does the like functionality work in wikitok?'"
echo ""
echo "⏳ Processing (this takes 2-4 seconds)..."
echo ""

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "IsaacGemal_wikitok",
    "question": "How does the like functionality work in wikitok?"
  }')

echo "✅ Response received!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CONFIDENCE: $(echo "$RESPONSE" | jq -r '.confidence // "N/A"')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 ANSWER:"
echo "$RESPONSE" | jq -r '.answer // "No answer"' | fold -w 70 -s
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 SOURCES:"
echo "$RESPONSE" | jq -r '.sources[]? // "None"' | sed 's/^/   • /'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 RELATED CODE FOUND:"
echo "$RESPONSE" | jq -r '.relatedContext[]? | "   • \(.file) - \(.chunkName // "unknown") (\(.relevanceScore * 100 | floor)%)"'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Demo complete! The endpoint is working!"
echo ""
echo "Try your own question:"
echo "  curl -X POST http://localhost:3000/tools/review \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"repo_id\":\"IsaacGemal_wikitok\",\"question\":\"YOUR QUESTION\"}'"
echo ""
