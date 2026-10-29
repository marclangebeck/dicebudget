import { Router } from "express";
import { hasValidAdminKey, requireAdminKey } from "../middleware/adminAuth.js";
import { isValidPlayerId, normalizePlayerId } from "../domain/playerIdentity.js";
import { getStats, getStatsGlobal } from "../services/getStats.js";
import {
  getPairingDetail,
  listPairingSummaries,
  resetPairings,
  upsertPairingBaselines,
  type PairingBaselineInput,
} from "../services/pairingStats.js";

export const statsRouter = Router();

function playerIdFromQuery(req: { query: Record<string, unknown> }): string | null {
  const raw = req.query.playerId;
  if (typeof raw !== "string") return null;
  const id = normalizePlayerId(raw);
  return isValidPlayerId(id) ? id : null;
}

statsRouter.get("/", async (req, res, next) => {
  try {
    if (hasValidAdminKey(req)) {
      const stats = await getStatsGlobal();
      res.json({ stats });
      return;
    }
    const playerId = playerIdFromQuery(req);
    const stats = await getStats(playerId);
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

statsRouter.get("/pairings", async (req, res, next) => {
  try {
    if (hasValidAdminKey(req)) {
      const pairings = await listPairingSummaries(null);
      res.json({ pairings });
      return;
    }
    const playerId = playerIdFromQuery(req);
    if (!playerId) {
      res.json({ pairings: [] });
      return;
    }
    const pairings = await listPairingSummaries(playerId);
    res.json({ pairings });
  } catch (error) {
    next(error);
  }
});

statsRouter.post("/pairings/reset", requireAdminKey, async (req, res, next) => {
  try {
    const raw = (req.body as { keys?: unknown })?.keys;
    const keys = Array.isArray(raw)
      ? raw.filter((k): k is string => typeof k === "string" && k.trim().length > 0)
      : [];
    if (keys.length === 0) {
      res.status(400).json({ error: "keys required" });
      return;
    }
    const result = await resetPairings(keys);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/** Baseline-Korrektur nur mit Admin-Key (M38): globale Bilanz, nicht pro Spieler-Gerät. */
statsRouter.post("/pairings/baseline", requireAdminKey, async (req, res, next) => {
  try {
    const raw = (req.body as { entries?: unknown })?.entries;
    if (!Array.isArray(raw)) {
      res.status(400).json({ error: "entries required" });
      return;
    }
    const entries: PairingBaselineInput[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const key = typeof o.key === "string" ? o.key.trim() : "";
      if (!key) continue;
      entries.push({
        key,
        extraWinsA: Number(o.extraWinsA),
        extraWinsB: Number(o.extraWinsB),
        extraBonusA: Number(o.extraBonusA),
        extraBonusB: Number(o.extraBonusB),
        isAbsolute: o.isAbsolute === true || o.isAbsolute === "true" || o.isAbsolute === 1,
        note: typeof o.note === "string" ? o.note : null,
      });
    }
    if (entries.length === 0) {
      res.status(400).json({ error: "no valid entries" });
      return;
    }
    const result = await upsertPairingBaselines(entries);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

statsRouter.get("/pairing", async (req, res, next) => {
  try {
    const key = typeof req.query.key === "string" ? req.query.key : "";
    if (!key.trim()) {
      res.status(400).json({ error: "key required" });
      return;
    }
    if (hasValidAdminKey(req)) {
      const pairing = await getPairingDetail(key, null);
      if (!pairing) {
        res.status(404).json({ error: "Pairing not found" });
        return;
      }
      res.json({ pairing });
      return;
    }
    const playerId = playerIdFromQuery(req);
    if (!playerId) {
      res.status(404).json({ error: "Pairing not found" });
      return;
    }
    const pairing = await getPairingDetail(key, playerId);
    if (!pairing) {
      res.status(404).json({ error: "Pairing not found" });
      return;
    }
    res.json({ pairing });
  } catch (error) {
    next(error);
  }
});
