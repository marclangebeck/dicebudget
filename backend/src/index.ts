import { PORT } from "./config.js";
import { prisma } from "./db/prisma.js";
import { createApp } from "./app.js";

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`dicebudget-backend listening on http://127.0.0.1:${PORT}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    void prisma.$disconnect().finally(() => {
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
