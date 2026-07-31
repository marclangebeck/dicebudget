import { Router } from "express";
import { readPlayerSecret } from "./readPlayerSecret.js";
import { isBurnMode } from "../domain/houseRules.js";
import {
  applyBurnRoll,
  applyYatzyStreakPenalty,
} from "../services/houseRulesService.js";

function routeParam(value: string | string[]): string {
  return typeof value === "string" ? value : (value[0] ?? "");
}

export const houseRulesRouter = Router({ mergeParams: true });

houseRulesRouter.post("/burn", async (req, res, next) => {
  try {
    const fieldId = req.body?.fieldId;
    if (typeof fieldId !== "string" || !fieldId.trim()) {
      res.status(400).json({ error: "fieldId required" });
      return;
    }
    const modeRaw = req.body?.mode;
    const mode = modeRaw === undefined || modeRaw === null ? "reroll" : modeRaw;
    if (!isBurnMode(mode)) {
      res.status(400).json({ error: "mode must be reroll or set_face" });
      return;
    }
    const run = await applyBurnRoll(
      routeParam((req.params as { runId: string }).runId),
      fieldId.trim(),
      mode,
      readPlayerSecret(req),
    );
    res.json({ run });
  } catch (error) {
    next(error);
  }
});

houseRulesRouter.post("/yatzy-streak-penalty", async (req, res, next) => {
  try {
    const victimPlayerId = req.body?.victimPlayerId;
    if (typeof victimPlayerId !== "string" || !victimPlayerId.trim()) {
      res.status(400).json({ error: "victimPlayerId required" });
      return;
    }
    const result = await applyYatzyStreakPenalty(
      routeParam((req.params as { runId: string }).runId),
      victimPlayerId.trim(),
      readPlayerSecret(req),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});
