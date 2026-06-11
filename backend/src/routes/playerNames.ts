import { Router } from "express";
import { requireAdminKey } from "../middleware/adminAuth.js";
import {
  listPlayerNameAliases,
  mergePlayerNames,
  removePlayerNameAlias,
} from "../services/playerNames.js";

export const playerNamesRouter = Router();

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
