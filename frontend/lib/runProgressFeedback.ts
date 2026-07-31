import { getProgressHintsEnabled } from "@/lib/gameFeedbackPrefs";
import { normalizePublicPlayerId } from "@/lib/playerIdentity";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import type { TableModeSide } from "@/lib/tableMode";
import type { RunDto } from "@/lib/types";

export const PROGRESS_MILESTONES = [25, 50, 75] as const;
export type ProgressMilestonePercent = (typeof PROGRESS_MILESTONES)[number];

/** Nur manuell schließen — kein Auto-Dismiss. */
export const RUN_PROGRESS_DURATION_MS = 0;

export type ProgressPositionHint = "ahead" | "behind" | "even";

export type RunProgressOverlayState = {
  percent: ProgressMilestonePercent;
  positionHint?: ProgressPositionHint | null;
  /** Eigener Score minus bester Gegner (positiv = Führung). */
  scoreDelta?: number | null;
};

export type ProgressPositionContext =
  | { kind: "lobby"; lobby: SessionLobbyDto; ownPlayerId: string }
  | { kind: "table"; ownSide: TableModeSide; runs: Record<TableModeSide, RunDto | null> };

export type ProgressPositionResolved = {
  hint: ProgressPositionHint;
  scoreDelta: number;
};

function countScoredFields(run: RunDto): number {
  return run.games.flatMap((g) => g.fields).filter((f) => f.score !== null).length;
}

function totalFields(run: RunDto): number {
  return run.games.flatMap((g) => g.fields).length;
}

function progressPercent(run: RunDto): number {
  const total = totalFields(run);
  if (total === 0) return 0;
  return (countScoredFields(run) / total) * 100;
}

/** Summe eingetragener Feldpunkte — ohne oberen Bonus (+35) und ohne Extra-Yatzy. */
export function enteredDiceScore(run: RunDto): number {
  let sum = 0;
  for (const game of run.games) {
    for (const field of game.fields) {
      if (field.score !== null) sum += field.score;
    }
  }
  return sum;
}

/**
 * Feldpunkt-Summe eines Lobby-Spielers.
 * Nutzt nur `diceScore` — niemals `totalScore` (enthält Bonus/Extra-Yatzy).
 */
export function lobbyPlayerDiceScore(
  player: { diceScore?: number },
): number | null {
  return typeof player.diceScore === "number" && Number.isFinite(player.diceScore)
    ? player.diceScore
    : null;
}

function deltaFromScores(myScore: number, otherScore: number): ProgressPositionResolved {
  const scoreDelta = myScore - otherScore;
  if (scoreDelta > 0) return { hint: "ahead", scoreDelta };
  if (scoreDelta < 0) return { hint: "behind", scoreDelta };
  return { hint: "even", scoreDelta: 0 };
}

/** Ob der Feldanteil einen neuen 25/50/75-%-Meilenstein kreuzt (ohne Overlay-Prefs). */
export function wouldCrossProgressMilestone(
  runBefore: RunDto,
  runAfter: RunDto,
  alreadyShown: ReadonlySet<number>,
): ProgressMilestonePercent | null {
  const beforePct = progressPercent(runBefore);
  const afterPct = progressPercent(runAfter);

  for (const milestone of PROGRESS_MILESTONES) {
    if (alreadyShown.has(milestone)) continue;
    if (beforePct < milestone && afterPct >= milestone) {
      return milestone;
    }
  }
  return null;
}

export function resolveProgressPosition(
  run: RunDto,
  context: ProgressPositionContext | null,
): ProgressPositionResolved | null {
  if (!context) return null;

  if (context.kind === "table") {
    const otherSide: TableModeSide = context.ownSide === "left" ? "right" : "left";
    const otherRun = context.runs[otherSide];
    if (!otherRun) return null;
    return deltaFromScores(enteredDiceScore(run), enteredDiceScore(otherRun));
  }

  const ownNorm = normalizePublicPlayerId(context.ownPlayerId);
  const myDice = enteredDiceScore(run);
  const others = context.lobby.players.filter(
    (player) => normalizePublicPlayerId(player.playerId) !== ownNorm,
  );
  if (others.length === 0) return null;

  const otherDiceScores = others
    .map((player) => lobbyPlayerDiceScore(player))
    .filter((score): score is number => score !== null);
  if (otherDiceScores.length === 0) return null;

  const bestOtherDice = Math.max(...otherDiceScores);
  return deltaFromScores(myDice, bestOtherDice);
}

/** @deprecated Prefer resolveProgressPosition */
export function resolveProgressPositionHint(
  run: RunDto,
  context: ProgressPositionContext | null,
): ProgressPositionHint | null {
  return resolveProgressPosition(run, context)?.hint ?? null;
}

export function progressPositionLabel(hint: ProgressPositionHint | null | undefined): string | null {
  if (hint === "ahead") return "Du liegst vorn";
  if (hint === "behind") return "Du liegst zurück";
  if (hint === "even") return "Gleichauf";
  return null;
}

export function progressScoreDeltaLabel(
  hint: ProgressPositionHint | null | undefined,
  scoreDelta: number | null | undefined,
): string | null {
  if (hint == null || scoreDelta == null || hint === "even") return null;
  const abs = Math.abs(scoreDelta);
  if (hint === "ahead") {
    return abs === 1 ? "1 Punkt voraus" : `${abs} Punkte voraus`;
  }
  return abs === 1 ? "1 Punkt zurück" : `${abs} Punkte zurück`;
}

export function buildProgressMilestoneAfterField(
  runBefore: RunDto,
  runAfter: RunDto,
  alreadyShown: ReadonlySet<number>,
  context?: ProgressPositionContext | null,
): RunProgressOverlayState | null {
  if (!getProgressHintsEnabled()) return null;

  const milestone = wouldCrossProgressMilestone(runBefore, runAfter, alreadyShown);
  if (milestone == null) return null;

  const position = resolveProgressPosition(runAfter, context ?? null);
  return {
    percent: milestone,
    positionHint: position?.hint ?? null,
    scoreDelta: position?.scoreDelta ?? null,
  };
}
