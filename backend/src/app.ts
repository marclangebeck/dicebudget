import cors from "cors";
import express from "express";
import helmet from "helmet";
import {
  FIELDS_PER_GAME,
  MAX_GAME_COUNT,
  MIN_GAME_COUNT,
  ROLLS_PER_FIELD,
} from "./config.js";
import { isAllowedCorsOrigin } from "./lib/corsOrigins.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { playerNamesRouter } from "./routes/playerNames.js";
import { runsRouter } from "./routes/runs.js";
import { sessionsRouter } from "./routes/sessions.js";
import { statsRouter } from "./routes/stats.js";
import { tournamentsRouter } from "./routes/tournaments.js";

/** Express-App ohne Listen — für Tests und Produktion. */
export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedCorsOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
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
  app.use("/player-names", playerNamesRouter);
  app.use("/tournaments", tournamentsRouter);

  app.use(errorHandler);

  return app;
}
