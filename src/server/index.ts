// server/index.ts
import app from "./app.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Code Review AI Server running on http://localhost:${PORT}`);
  console.log("\nAvailable endpoints:");
  console.log(`  GET  /status`);
  console.log(`  POST /init-repository/:repo_id`);
  console.log(`  POST /review-pr/:pr_number`);
  console.log(`  POST /tools/review`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default server;
