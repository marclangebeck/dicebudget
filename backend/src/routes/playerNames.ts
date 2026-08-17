import { Router } from "express";
import { requireAdminKey } from "../middleware/adminAuth.js";
import { playerDisplayNameLimiter } from "../middleware/rateLimits.js";
import {
  deletePlayerDisplayName,
  listPlayerDisplayNames,
  upsertPlayerDisplayName,
} from "../services/playerDisplayNames.js";
import {
  listPlayerNameAliases,
  mergePlayerNames,
  removePlayerNameAlias,
} from "../services/playerNames.js";

export const playerNamesRouter = Router();

playerNamesRouter.get("/display", async (req, res, next) => {
  try {
    const names = await listPlayerDisplayNames(req.query.ids);
    res.json({ names });
  } catch (error) {
    next(error);
  }
});

playerNamesRouter.put("/display", playerDisplayNameLimiter, async (req, res, next) => {
  try {
    const headerToken = req.header("X-Name-Token");
    const result = await upsertPlayerDisplayName({
      playerId: req.body?.playerId,
      displayName: req.body?.displayName,
      nameToken: headerToken || req.body?.nameToken,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

playerNamesRouter.delete("/display", playerDisplayNameLimiter, async (req, res, next) => {
  try {
    await deletePlayerDisplayName({
      playerId: req.body?.playerId,
      nameToken: req.header("X-Name-Token") || req.body?.nameToken,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

playerNamesRouter.get("/aliases", async (_req, res, next) => {
  try {
    const aliases = await listPlayerNameAliases();
    res.json({ aliases });
  } catch (error) {
    next(error);
  }
});

playerNamesRouter.post("/aliases", requireAdminKey, async (req, res, next) => {
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

playerNamesRouter.delete("/aliases/:aliasName", requireAdminKey, async (req, res, next) => {
  try {
    const aliasName =
      typeof req.params.aliasName === "string" ? req.params.aliasName : req.params.aliasName?.[0];
    if (!aliasName?.trim()) {
      res.status(400).json({ error: "aliasName required" });
      return;
    }
    await removePlayerNameAlias(aliasName);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
