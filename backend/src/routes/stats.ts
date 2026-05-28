import { Router } from "express";
import { getStats } from "../services/getStats.js";
import { getPairingDetail, listPairingSummaries } from "../services/pairingStats.js";

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

