import { Router } from "express";
import { assertRunPlayerAccess } from "../services/runPlayerAuth.js";
import { createRun } from "../services/createRun.js";
import { getRunById } from "../services/getRun.js";
import { getRunMatchAnalysisSolo } from "../services/matchAnalysisService.js";
import { abandonRun, finishRun, incrementExtraYatzy } from "../services/playField.js";
import { readPlayerSecret } from "./readPlayerSecret.js";
import { fieldsRouter } from "./fields.js";

export const runsRouter = Router();

runsRouter.post("/", async (req, res, next) => {
  try {
    const gameCount = Number(req.body?.gameCount);
    const useStrategyRules =
      req.body?.useStrategyRules === undefined
        ? true
        : Boolean(req.body.useStrategyRules);
    const result = await createRun(gameCount, useStrategyRules);
    const run = await getRunById(result.runId);
    res.status(201).json({ run });
  } catch (error) {
    next(error);
  }
});

runsRouter.use("/:runId/fields", fieldsRouter);

runsRouter.post("/:runId/finish", async (req, res, next) => {
  try {
    const run = await finishRun(req.params.runId, readPlayerSecret(req));
    res.json({ run });
  } catch (error) {
    next(error);
  }
});

runsRouter.post("/:runId/extra-yatzy", async (req, res, next) => {
  try {
    const run = await incrementExtraYatzy(req.params.runId, readPlayerSecret(req));
    res.json({ run });
  } catch (error) {
    next(error);
  }
});

runsRouter.post("/:runId/abandon", async (req, res, next) => {
  try {
    const run = await abandonRun(req.params.runId, readPlayerSecret(req));
    res.json({ run });
  } catch (error) {
    next(error);
  }
});

runsRouter.get("/:id/match-analysis", async (req, res, next) => {
  try {
    await assertRunPlayerAccess(req.params.id, readPlayerSecret(req));
    const analysis = await getRunMatchAnalysisSolo(req.params.id);
    res.json({ analysis });
  } catch (error) {
    next(error);
  }
});

runsRouter.get("/:id", async (req, res, next) => {
  try {
    await assertRunPlayerAccess(req.params.id, readPlayerSecret(req));
    const run = await getRunById(req.params.id);
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }
    res.json({ run });
  } catch (error) {
    next(error);
  }
});
