import type { NextFunction, Request, Response } from "express";
import { InvalidFieldScoreError } from "../domain/fieldScores.js";
import { InvalidGameCountError } from "../services/createRun.js";
import {
  FieldAlreadyScoredError,
  FieldNotFoundError,
  FieldNotScoredError,
  InvalidDiceError,
  InvalidInputError,
  InvalidYatzyDieValueError,
  NotLastScoredFieldError,
  RollLimitError,
  RunNotActiveError,
  RunNotCompleteError,
  RunNotFoundError,
} from "../services/playField.js";
import { ForbiddenRunError } from "../services/runPlayerAuth.js";
import {
  MatchAnalysisNotReadyError,
  MatchAnalysisNotSupportedError,
} from "../services/matchAnalysisService.js";
import {
  InvalidPlayerNameError,
  InvalidSessionPlayersError,
  LeagueNotFoundError,
  PoolEndgameInputError,
  PoolEndgameNotAvailableError,
  SessionFinishedError,
  PlayerAlreadyInSessionError,
  SessionFullError,
  SessionNotFoundError,
  SessionNotReadyError,
} from "../services/sessionService.js";
import {
  InvalidPlayerNameMergeError,
  PlayerNameAliasNotFoundError,
} from "../services/playerNames.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof InvalidGameCountError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (
    err instanceof InvalidSessionPlayersError ||
    err instanceof InvalidPlayerNameError ||
    err instanceof PoolEndgameInputError
  ) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof PoolEndgameNotAvailableError) {
    res.status(409).json({ error: err.message });
    return;
  }
  if (err instanceof MatchAnalysisNotReadyError) {
    res.status(409).json({ error: err.message });
    return;
  }
  if (err instanceof MatchAnalysisNotSupportedError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof LeagueNotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof InvalidPlayerNameMergeError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof ForbiddenRunError) {
    res.status(403).json({ error: err.message });
    return;
  }
  if (
    err instanceof InvalidDiceError ||
    err instanceof InvalidInputError ||
    err instanceof InvalidFieldScoreError ||
    err instanceof InvalidYatzyDieValueError ||
    err instanceof RollLimitError
  ) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (
    err instanceof RunNotFoundError ||
    err instanceof FieldNotFoundError ||
    err instanceof SessionNotFoundError ||
    err instanceof PlayerNameAliasNotFoundError
  ) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (
    err instanceof PlayerAlreadyInSessionError ||
    err instanceof SessionFullError ||
    err instanceof SessionFinishedError ||
    err instanceof SessionNotReadyError ||
    err instanceof RunNotActiveError ||
    err instanceof FieldAlreadyScoredError ||
    err instanceof FieldNotScoredError ||
    err instanceof NotLastScoredFieldError ||
    err instanceof RunNotCompleteError
  ) {
    res.status(409).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
