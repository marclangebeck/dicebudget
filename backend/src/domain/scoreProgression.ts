import { computeGameBreakdown } from "./gameScoring.js";
import type { AnalysisRun } from "./matchAnalysis.js";

export type ScoreProgressionPlayer = {
  id: string;
  name: string;
};

export type ScoreProgressionPoint = {
  /** Eintragsindex 0…n (0 = Start). */
  turn: number;
  /** Gesamtpunkte je Spieler (Reihenfolge = players[]). */
  scores: number[];
  /** Index des Führenden; null bei Gleichstand an der Spitze. */
  leaderIndex: number | null;
  /** Vorsprung des Führenden vor Platz 2 (0 bei Gleichstand). */
  leadMargin: number;
};

export type ScoreProgression = {
  players: ScoreProgressionPlayer[];
  points: ScoreProgressionPoint[];
  finalLeaderIndex: number | null;
  leadChanges: number;
};

type TimelineEntry = {
  scoredSequence: number;
  totalScore: number;
};

type ProgressEvent = {
  scoredSequence: number;
  playerIndex: number;
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

function leadState(scores: number[]): {
  leaderIndex: number | null;
  leadMargin: number;
} {
  if (scores.length === 0) return { leaderIndex: null, leadMargin: 0 };
  let best = -Infinity;
  let second = -Infinity;
  let bestIndex = -1;
  let bestCount = 0;
  for (let i = 0; i < scores.length; i += 1) {
    const score = scores[i]!;
    if (score > best) {
      second = best;
      best = score;
      bestIndex = i;
      bestCount = 1;
    } else if (score === best) {
      bestCount += 1;
    } else if (score > second) {
      second = score;
    }
  }
  if (bestCount !== 1 || bestIndex < 0) {
    return { leaderIndex: null, leadMargin: 0 };
  }
  const runnerUp = second === -Infinity ? best : second;
  return { leaderIndex: bestIndex, leadMargin: Math.max(0, best - runnerUp) };
}

/**
 * Punkteverlauf für 2–n Spieler.
 * Einträge werden nach scoredSequence (dann Spielerindex) gemischt —
 * entspricht dem Fortschritt, auch wenn Zettel asynchron gefüllt werden.
 */
export function buildMultiPlayerScoreProgression(
  participants: Array<{
    playerId: string;
    playerName: string;
    run: AnalysisRun;
  }>,
): ScoreProgression | null {
  if (participants.length < 2) return null;

  const players: ScoreProgressionPlayer[] = participants.map((p) => ({
    id: p.playerId,
    name: p.playerName,
  }));

  const events: ProgressEvent[] = [];
  participants.forEach((participant, playerIndex) => {
    for (const entry of runningTotalForRun(participant.run)) {
      events.push({
        scoredSequence: entry.scoredSequence,
        playerIndex,
        totalScore: entry.totalScore,
      });
    }
  });

  if (events.length === 0) return null;

  events.sort(
    (a, b) =>
      a.scoredSequence - b.scoredSequence || a.playerIndex - b.playerIndex,
  );

  const scores = participants.map(() => 0);
  const start = leadState(scores);
  const points: ScoreProgressionPoint[] = [
    {
      turn: 0,
      scores: [...scores],
      leaderIndex: start.leaderIndex,
      leadMargin: start.leadMargin,
    },
  ];

  let previousLeader: number | null = null;
  let leadChanges = 0;
  let turn = 0;

  for (const event of events) {
    scores[event.playerIndex] = event.totalScore;
    turn += 1;
    const { leaderIndex, leadMargin } = leadState(scores);
    if (
      turn > 0 &&
      leaderIndex != null &&
      previousLeader != null &&
      leaderIndex !== previousLeader
    ) {
      leadChanges += 1;
    }
    if (leaderIndex != null) previousLeader = leaderIndex;

    points.push({
      turn,
      scores: [...scores],
      leaderIndex,
      leadMargin,
    });
  }

  const final = points[points.length - 1]!;
  return {
    players,
    points,
    finalLeaderIndex: final.leaderIndex,
    leadChanges,
  };
}

/** Abwärtskompatibel: Zwei-Spieler-Verlauf. */
export function buildHeadToHeadScoreProgression(
  runA: AnalysisRun,
  runB: AnalysisRun,
  playerAId: string,
  playerAName: string,
  playerBId: string,
  playerBName: string,
): ScoreProgression | null {
  return buildMultiPlayerScoreProgression([
    { playerId: playerAId, playerName: playerAName, run: runA },
    { playerId: playerBId, playerName: playerBName, run: runB },
  ]);
}
