import { Router } from "express";
import {
  createTournamentLimiter,
  joinTournamentLimiter,
} from "../middleware/rateLimits.js";
import {
  createTournament,
  createTournamentMatchSession,
  getTournamentByInviteCode,
  joinTournament,
  patchTournamentDraw,
  prepareTournamentDraw,
  releaseNextTournamentRound,
  shuffleTournamentDraw,
  startTournament,
} from "../services/tournamentService.js";

export const tournamentsRouter = Router();

function routeParam(value: string | string[]): string {
  return typeof value === "string" ? value : (value[0] ?? "");
}

function readHostToken(req: { header: (name: string) => string | undefined }): string | undefined {
  const raw = req.header("X-Host-Token")?.trim();
  return raw || undefined;
}

tournamentsRouter.post("/", createTournamentLimiter, async (req, res, next) => {
  try {
    const result = await createTournament({
      name: req.body?.name,
      modeKey: req.body?.modeKey,
      maxEntries: req.body?.maxEntries,
      config: req.body?.config,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

tournamentsRouter.get("/invite/:inviteCode", async (req, res, next) => {
  try {
    const result = await getTournamentByInviteCode(
      routeParam(req.params.inviteCode),
      readHostToken(req),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

tournamentsRouter.post(
  "/invite/:inviteCode/join",
  joinTournamentLimiter,
  async (req, res, next) => {
    try {
      const result = await joinTournament(routeParam(req.params.inviteCode), {
        displayName: req.body?.displayName,
        playerId: req.body?.playerId,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

tournamentsRouter.post("/:tournamentId/start", async (req, res, next) => {
  try {
    const hostToken = readHostToken(req);
    if (!hostToken) {
      res.status(403).json({ error: "X-Host-Token erforderlich" });
      return;
    }
    const result = await startTournament(
      routeParam(req.params.tournamentId),
      hostToken,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

tournamentsRouter.post("/:tournamentId/draw", async (req, res, next) => {
  try {
    const hostToken = readHostToken(req);
    if (!hostToken) {
      res.status(403).json({ error: "X-Host-Token erforderlich" });
      return;
    }
    const action =
      typeof req.body?.action === "string" ? req.body.action.trim() : "prepare";
    const tournamentId = routeParam(req.params.tournamentId);
    const result =
      action === "shuffle"
        ? await shuffleTournamentDraw(tournamentId, hostToken)
        : await prepareTournamentDraw(tournamentId, hostToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

tournamentsRouter.patch("/:tournamentId/draw", async (req, res, next) => {
  try {
    const hostToken = readHostToken(req);
    if (!hostToken) {
      res.status(403).json({ error: "X-Host-Token erforderlich" });
      return;
    }
    const result = await patchTournamentDraw(
      routeParam(req.params.tournamentId),
      hostToken,
      req.body ?? {},
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

tournamentsRouter.post("/:tournamentId/rounds", async (req, res, next) => {
  try {
    const hostToken = readHostToken(req);
    if (!hostToken) {
      res.status(403).json({ error: "X-Host-Token erforderlich" });
      return;
    }
    const result = await releaseNextTournamentRound(
      routeParam(req.params.tournamentId),
      hostToken,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

tournamentsRouter.post(
  "/:tournamentId/matches/:matchId/session",
  async (req, res, next) => {
    try {
      const hostToken = readHostToken(req);
      if (!hostToken) {
        res.status(403).json({ error: "X-Host-Token erforderlich" });
        return;
      }
      const result = await createTournamentMatchSession(
        routeParam(req.params.tournamentId),
        routeParam(req.params.matchId),
        hostToken,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);
