import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await genAI.models.embedContent({
  model: "text-embedding-004",
  contents: {
    parts: [{ text: "Hello world" }],
  },
});

console.log("Full response:", JSON.stringify(response, null, 2));
console.log("Response keys:", Object.keys(response));
console.log("response.embedding:", response.embedding);
