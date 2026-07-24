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
    const yatzyDieValueRaw = req.body?.yatzyDieValue;
    const yatzyDieValue =
      yatzyDieValueRaw === undefined || yatzyDieValueRaw === null
        ? undefined
        : Number(yatzyDieValueRaw);
    if (Number.isNaN(score) || Number.isNaN(rollsUsed)) {
      res.status(400).json({ error: "score and rollsUsed required" });
      return;
    }
    if (yatzyDieValue !== undefined && Number.isNaN(yatzyDieValue)) {
      res.status(400).json({ error: "yatzyDieValue must be a number" });
      return;
    }
    const { run, events } = await completeField(
      runId,
      fieldId,
      { score, rollsUsed, yatzyDieValue },
      readPlayerSecret(req),
    );
    res.json({ run, events: events ?? [] });
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
