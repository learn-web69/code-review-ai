import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await genAI.models.embedContent({
  model: "gemini-embedding-001",
  contents: {
    parts: [{ text: "Hello world" }],
  },
});

console.log("Embedding dimension:", response.embeddings[0].values.length);
console.log("First 10 values:", response.embeddings[0].values.slice(0, 10));
