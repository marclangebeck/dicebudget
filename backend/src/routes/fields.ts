import { Router } from "express";
import { completeField, recordRoll, clearLastField } from "../services/playField.js";
import { readPlayerSecret } from "./readPlayerSecret.js";

export const fieldsRouter = Router({ mergeParams: true });

fieldsRouter.post("/:fieldId/rolls", async (req, res, next) => {
  try {
    const { runId, fieldId } = req.params as { runId: string; fieldId: string };
    const diceValues = req.body?.diceValues as number[] | undefined;
    if (!Array.isArray(diceValues)) {
      res.status(400).json({ error: "diceValues array required" });
      return;
    }
    const run = await recordRoll(runId, fieldId, diceValues, readPlayerSecret(req));
    res.json({ run });
  } catch (error) {
    next(error);
  }
});

fieldsRouter.post("/:fieldId/complete", async (req, res, next) => {
  try {
    const { runId, fieldId } = req.params as { runId: string; fieldId: string };
    const score = Number(req.body?.score);
    const rollsUsed = Number(req.body?.rollsUsed);
    if (Number.isNaN(score) || Number.isNaN(rollsUsed)) {
      res.status(400).json({ error: "score and rollsUsed required" });
      return;
    }
    const run = await completeField(runId, fieldId, { score, rollsUsed }, readPlayerSecret(req));
    res.json({ run });
  } catch (error) {
    next(error);
  }
});

fieldsRouter.post("/:fieldId/clear", async (req, res, next) => {
  try {
    const { runId, fieldId } = req.params as { runId: string; fieldId: string };
    const run = await clearLastField(runId, fieldId, readPlayerSecret(req));
    res.json({ run });
  } catch (error) {
    next(error);
  }
});
