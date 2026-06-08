import { getProgressHintsEnabled } from "@/lib/gameFeedbackPrefs";
import type { RunDto } from "@/lib/types";

export const PROGRESS_MILESTONES = [25, 50, 75] as const;
export type ProgressMilestonePercent = (typeof PROGRESS_MILESTONES)[number];

export const RUN_PROGRESS_DURATION_MS = 1600;

export type RunProgressOverlayState = {
  percent: ProgressMilestonePercent;
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

export function buildProgressMilestoneAfterField(
  runBefore: RunDto,
  runAfter: RunDto,
  alreadyShown: ReadonlySet<number>,
): RunProgressOverlayState | null {
  if (!getProgressHintsEnabled()) return null;

  const beforePct = progressPercent(runBefore);
  const afterPct = progressPercent(runAfter);

  for (const milestone of PROGRESS_MILESTONES) {
    if (alreadyShown.has(milestone)) continue;
    if (beforePct < milestone && afterPct >= milestone) {
      return { percent: milestone };
    }
  }
  return null;
}
