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
};

export type ProgressPositionContext =
  | { kind: "lobby"; lobby: SessionLobbyDto; ownPlayerId: string }
  | { kind: "table"; ownSide: TableModeSide; runs: Record<TableModeSide, RunDto | null> };

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

export function resolveProgressPositionHint(
  run: RunDto,
  context: ProgressPositionContext | null,
): ProgressPositionHint | null {
  if (!context) return null;

  if (context.kind === "table") {
    const otherSide: TableModeSide = context.ownSide === "left" ? "right" : "left";
    const otherRun = context.runs[otherSide];
    if (!otherRun) return null;
    if (run.totalScore > otherRun.totalScore) return "ahead";
    if (run.totalScore < otherRun.totalScore) return "behind";
    return "even";
  }

  const ownNorm = normalizePublicPlayerId(context.ownPlayerId);
  const ranked = [...context.lobby.players].sort((a, b) => b.totalScore - a.totalScore);
  const myIndex = ranked.findIndex((player) => normalizePublicPlayerId(player.playerId) === ownNorm);
  if (myIndex < 0 || ranked.length < 2) return null;

  const myScore = run.totalScore;
  const bestOther = ranked.find((player) => normalizePublicPlayerId(player.playerId) !== ownNorm)
    ?.totalScore;
  if (bestOther == null) return null;

  if (myScore > bestOther) return "ahead";
  if (myScore < bestOther) return "behind";
  return "even";
}

export function progressPositionLabel(hint: ProgressPositionHint | null | undefined): string | null {
  if (hint === "ahead") return "Du liegst vorn";
  if (hint === "behind") return "Du liegst zurück";
  if (hint === "even") return "Gleichauf";
  return null;
}

export function buildProgressMilestoneAfterField(
  runBefore: RunDto,
  runAfter: RunDto,
  alreadyShown: ReadonlySet<number>,
  context?: ProgressPositionContext | null,
): RunProgressOverlayState | null {
  if (!getProgressHintsEnabled()) return null;

  const beforePct = progressPercent(runBefore);
  const afterPct = progressPercent(runAfter);

  for (const milestone of PROGRESS_MILESTONES) {
    if (alreadyShown.has(milestone)) continue;
    if (beforePct < milestone && afterPct >= milestone) {
      return {
        percent: milestone,
        positionHint: resolveProgressPositionHint(runAfter, context ?? null),
      };
    }
  }
  return null;
}
