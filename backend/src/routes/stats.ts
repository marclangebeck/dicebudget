import { Router } from "express";
import { getStats } from "../services/getStats.js";
import { getPairingDetail, listPairingSummaries } from "../services/pairingStats.js";
import {
  InvalidPlayerNameMergeError,
  PlayerNameAliasNotFoundError,
  listKnownPlayerNames,
  listPlayerNameAliases,
  mergePlayerNames,
  removePlayerNameAlias,
} from "../services/playerNames.js";

export const statsRouter = Router();

statsRouter.get("/", async (_req, res, next) => {
  try {
    const stats = await getStats();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

statsRouter.get("/pairings", async (_req, res, next) => {
  try {
    const pairings = await listPairingSummaries();
    res.json({ pairings });
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
    const pairing = await getPairingDetail(key);
    if (!pairing) {
      res.status(404).json({ error: "Pairing not found" });
      return;
    }
    res.json({ pairing });
  } catch (error) {
    next(error);
  }
});

statsRouter.get("/names", async (_req, res, next) => {
  try {
    const [names, aliases] = await Promise.all([
      listKnownPlayerNames(),
      listPlayerNameAliases(),
    ]);
    res.json({ names, aliases });
  } catch (error) {
    next(error);
  }
});

statsRouter.post("/names/merge", async (req, res, next) => {
  try {
    const aliasName = req.body?.aliasName;
    const canonicalName = req.body?.canonicalName;
    if (typeof aliasName !== "string" || typeof canonicalName !== "string") {
      res.status(400).json({ error: "aliasName and canonicalName required" });
      return;
    }
    const alias = await mergePlayerNames(aliasName, canonicalName);
    res.status(201).json({ alias });
  } catch (error) {
    next(error);
  }
});

statsRouter.delete("/names/merge", async (req, res, next) => {
  try {
    const aliasName = req.body?.aliasName;
    if (typeof aliasName !== "string") {
      res.status(400).json({ error: "aliasName required" });
      return;
    }
    await removePlayerNameAlias(aliasName);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
