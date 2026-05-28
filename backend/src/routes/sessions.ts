import { Router } from "express";
import {
  createGameSession,
  getSessionLobbyByInvite,
  getSessionRanking,
  joinSession,
} from "../services/sessionService.js";

export const sessionsRouter = Router();

sessionsRouter.post("/", async (req, res, next) => {
  try {
    const gameCount = Number(req.body?.gameCount);
    const maxPlayers = Number(req.body?.maxPlayers);
    const useStrategyRules =
      req.body?.useStrategyRules === undefined
        ? true
        : Boolean(req.body.useStrategyRules);
    if (Number.isNaN(gameCount) || Number.isNaN(maxPlayers)) {
      res.status(400).json({ error: "gameCount and maxPlayers required" });
      return;
    }
    const leagueCode =
      typeof req.body?.leagueCode === "string" && req.body.leagueCode.trim()
        ? req.body.leagueCode.trim()
        : undefined;
    const session = await createGameSession(gameCount, maxPlayers, useStrategyRules, leagueCode);
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

sessionsRouter.get("/invite/:inviteCode", async (req, res, next) => {
  try {
    const lobby = await getSessionLobbyByInvite(req.params.inviteCode);
    if (!lobby) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json({ session: lobby });
  } catch (error) {
    next(error);
  }
});

sessionsRouter.post("/invite/:inviteCode/join", async (req, res, next) => {
  try {
    const playerId = req.body?.playerId;
    if (typeof playerId !== "string") {
      res.status(400).json({ error: "playerId required" });
      return;
    }
    const result = await joinSession(req.params.inviteCode, playerId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

sessionsRouter.get("/invite/:inviteCode/ranking", async (req, res, next) => {
  try {
    const data = await getSessionRanking(req.params.inviteCode);
    if (!data) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json({ session: data });
  } catch (error) {
    next(error);
  }
});
