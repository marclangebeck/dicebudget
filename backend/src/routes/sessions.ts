import { Router } from "express";
import {
  createSessionLimiter,
  joinSessionLimiter,
} from "../middleware/rateLimits.js";
import { readPlayerSecret } from "./readPlayerSecret.js";
import { getSessionMatchAnalysis } from "../services/matchAnalysisService.js";
import {
  createGameSession,
  finalizeSessionStats,
  getSessionLobbyByInvite,
  getSessionRanking,
  joinSession,
  resolvePoolEndgame,
} from "../services/sessionService.js";
import { applyRollSale } from "../services/houseRulesService.js";

export const sessionsRouter = Router();

function routeParam(value: string | string[]): string {
  return typeof value === "string" ? value : (value[0] ?? "");
}

sessionsRouter.post("/", createSessionLimiter, async (req, res, next) => {
  try {
    const gameCount = Number(req.body?.gameCount);
    const maxPlayers = Number(req.body?.maxPlayers);
    const useStrategyRules =
      req.body?.useStrategyRules === undefined
        ? true
        : Boolean(req.body.useStrategyRules);
    const showOpponentPool = Boolean(req.body?.showOpponentPool);
    const poolEndgameEnabled = Boolean(req.body?.poolEndgameEnabled);
    const houseRulesBody =
      req.body?.houseRules && typeof req.body.houseRules === "object"
        ? (req.body.houseRules as Record<string, unknown>)
        : {};
    if (Number.isNaN(gameCount) || Number.isNaN(maxPlayers)) {
      res.status(400).json({ error: "gameCount and maxPlayers required" });
      return;
    }
    const leagueCode =
      typeof req.body?.leagueCode === "string" && req.body.leagueCode.trim()
        ? req.body.leagueCode.trim()
        : undefined;
    const session = await createGameSession(
      gameCount,
      maxPlayers,
      useStrategyRules,
      leagueCode,
      showOpponentPool,
      poolEndgameEnabled,
      {
        ruleYatzyStreak2:
          houseRulesBody.ruleYatzyStreak2 === undefined
            ? undefined
            : Boolean(houseRulesBody.ruleYatzyStreak2),
        ruleYatzyTriple:
          houseRulesBody.ruleYatzyTriple === undefined
            ? undefined
            : Boolean(houseRulesBody.ruleYatzyTriple),
        ruleUpperRace:
          houseRulesBody.ruleUpperRace === undefined
            ? undefined
            : Boolean(houseRulesBody.ruleUpperRace),
      },
    );
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

sessionsRouter.post("/invite/:inviteCode/join", joinSessionLimiter, async (req, res, next) => {
  try {
    const playerId = req.body?.playerId;
    if (typeof playerId !== "string") {
      res.status(400).json({ error: "playerId required" });
      return;
    }
    const result = await joinSession(routeParam(req.params.inviteCode), playerId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

sessionsRouter.post("/invite/:inviteCode/roll-sale", async (req, res, next) => {
  try {
    const sellerPlayerId = req.body?.sellerPlayerId;
    const buyerPlayerId = req.body?.buyerPlayerId;
    const pools = Number(req.body?.pools);
    if (typeof sellerPlayerId !== "string" || typeof buyerPlayerId !== "string") {
      res.status(400).json({ error: "sellerPlayerId and buyerPlayerId required" });
      return;
    }
    if (!Number.isInteger(pools) || pools < 1) {
      res.status(400).json({ error: "pools must be a positive integer" });
      return;
    }
    const result = await applyRollSale(
      routeParam(req.params.inviteCode),
      { sellerPlayerId, buyerPlayerId, pools },
      readPlayerSecret(req),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

sessionsRouter.post("/invite/:inviteCode/pool-endgame", async (req, res, next) => {
  try {
    const keep = req.body?.keep === true;
    const fieldId =
      typeof req.body?.fieldId === "string" ? req.body.fieldId : undefined;
    const score =
      req.body?.score === undefined ? undefined : Number(req.body.score);
    const data = await resolvePoolEndgame(
      req.params.inviteCode,
      { keep, fieldId, score },
      readPlayerSecret(req),
    );
    res.json({ session: data });
  } catch (error) {
    next(error);
  }
});

sessionsRouter.post("/invite/:inviteCode/finalize-stats", async (req, res, next) => {
  try {
    const includeInPairingStats = req.body?.includeInPairingStats !== false;
    const data = await finalizeSessionStats(
      req.params.inviteCode,
      includeInPairingStats,
      readPlayerSecret(req),
    );
    res.json({ session: data });
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

sessionsRouter.get("/invite/:inviteCode/match-analysis", async (req, res, next) => {
  try {
    const viewerPlayerId = req.query.viewerPlayerId;
    if (typeof viewerPlayerId !== "string" || !viewerPlayerId.trim()) {
      res.status(400).json({ error: "viewerPlayerId required" });
      return;
    }
    const analysis = await getSessionMatchAnalysis(
      req.params.inviteCode,
      viewerPlayerId,
      readPlayerSecret(req),
    );
    res.json({ analysis });
  } catch (error) {
    next(error);
  }
});
