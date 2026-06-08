import { computeGameBreakdown } from "./gameScoring.js";
import type { AnalysisRun } from "./matchAnalysis.js";

export type ScoreProgressionPoint = {
  turn: number;
  playerAScore: number;
  playerBScore: number;
  leader: "a" | "b" | "tie";
};

export type ScoreProgression = {
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  points: ScoreProgressionPoint[];
  finalLeader: "a" | "b" | "tie";
  leadChanges: number;
};

type TimelineEntry = {
  scoredSequence: number;
  totalScore: number;
};

function allFieldsScored(
  fields: Array<{ fieldType: string; score: number | null }>,
): boolean {
  return fields.every((field) => field.score !== null);
}

function runningTotalForRun(run: AnalysisRun): TimelineEntry[] {
  const scoredFields: Array<{
    scoredSequence: number;
    gameIndex: number;
    fieldType: string;
    score: number;
  }> = [];

  for (const game of run.games) {
    for (const field of game.fields) {
      if (field.score === null || field.scoredSequence == null) continue;
      scoredFields.push({
        scoredSequence: field.scoredSequence,
        gameIndex: game.index,
        fieldType: field.fieldType,
        score: field.score,
      });
    }
  }

  scoredFields.sort((a, b) => a.scoredSequence - b.scoredSequence);

  const fieldState = new Map<string, number | null>();
  for (const game of run.games) {
    for (const field of game.fields) {
      fieldState.set(`${game.index}:${field.fieldType}`, null);
    }
  }

  const extraYatzyByGame = new Map(
    run.games.map((game) => [game.index, game.summary.extraYatzyBonus]),
  );

  const timeline: TimelineEntry[] = [];
  for (const entry of scoredFields) {
    fieldState.set(`${entry.gameIndex}:${entry.fieldType}`, entry.score);

    let total = 0;
    for (const game of run.games) {
      const fields = game.fields.map((field) => ({
        fieldType: field.fieldType,
        score: fieldState.get(`${game.index}:${field.fieldType}`) ?? null,
      }));
      const includeExtra = allFieldsScored(fields);
      const breakdown = computeGameBreakdown(
        fields,
        includeExtra ? (extraYatzyByGame.get(game.index) ?? 0) : 0,
      );
      total += breakdown.gameTotal;
    }

    timeline.push({
      scoredSequence: entry.scoredSequence,
      totalScore: total,
    });
  }

  return timeline;
}

function leaderFor(a: number, b: number): ScoreProgressionPoint["leader"] {
  if (a > b) return "a";
  if (b > a) return "b";
  return "tie";
}

/** Verlauf der Gesamtpunkte (Spieler 1 vs. Spieler 2), abwechselnd nach Eintragsreihenfolge. */
export function buildHeadToHeadScoreProgression(
  runA: AnalysisRun,
  runB: AnalysisRun,
  playerAId: string,
  playerAName: string,
  playerBId: string,
  playerBName: string,
): ScoreProgression | null {
  const timelineA = runningTotalForRun(runA);
  const timelineB = runningTotalForRun(runB);
  if (timelineA.length === 0 && timelineB.length === 0) return null;

  const points: ScoreProgressionPoint[] = [{ turn: 0, playerAScore: 0, playerBScore: 0, leader: "tie" }];
  let idxA = 0;
  let idxB = 0;
  let totalA = 0;
  let totalB = 0;
  let turn = 0;
  let previousLeader: ScoreProgressionPoint["leader"] = "tie";
  let leadChanges = 0;

  while (idxA < timelineA.length || idxB < timelineB.length) {
    if (turn % 2 === 0 && idxA < timelineA.length) {
      totalA = timelineA[idxA]!.totalScore;
      idxA += 1;
    } else if (idxB < timelineB.length) {
      totalB = timelineB[idxB]!.totalScore;
      idxB += 1;
    } else if (idxA < timelineA.length) {
      totalA = timelineA[idxA]!.totalScore;
      idxA += 1;
    }

    turn += 1;
    const leader = leaderFor(totalA, totalB);
    if (turn > 0 && leader !== previousLeader && leader !== "tie" && previousLeader !== "tie") {
      leadChanges += 1;
    }
    if (leader !== "tie") previousLeader = leader;

    points.push({
      turn,
      playerAScore: totalA,
      playerBScore: totalB,
      leader,
    });
  }

  const final = points[points.length - 1]!;
  return {
    playerAId,
    playerAName,
    playerBId,
    playerBName,
    points,
    finalLeader: final.leader,
    leadChanges,
  };
}
