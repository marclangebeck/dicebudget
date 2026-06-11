import cors from "cors";
import express from "express";
import helmet from "helmet";
import {
  FIELDS_PER_GAME,
  MAX_GAME_COUNT,
  MIN_GAME_COUNT,
  PORT,
  ROLLS_PER_FIELD,
} from "./config.js";
import { prisma } from "./db/prisma.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { runsRouter } from "./routes/runs.js";
import { sessionsRouter } from "./routes/sessions.js";
import { statsRouter } from "./routes/stats.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://127.0.0.1:3021",
      "http://localhost:3021",
      "https://dicebudget.bottle-trade.de",
      "capacitor://localhost",
      "ionic://localhost",
    ],
  }),
);
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "dicebudget-backend",
    gameCount: { min: MIN_GAME_COUNT, max: MAX_GAME_COUNT },
    rules: {
      fieldsPerGame: FIELDS_PER_GAME,
      rollsPerField: ROLLS_PER_FIELD,
    },
  });
});

app.use("/runs", runsRouter);
app.use("/sessions", sessionsRouter);
app.use("/stats", statsRouter);

app.use(errorHandler);

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
