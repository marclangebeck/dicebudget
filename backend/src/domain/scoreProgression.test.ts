import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeGameBreakdown } from "./gameScoring.js";
import { FIELD_TYPES_PER_GAME } from "./fieldTypes.js";
import {
  buildHeadToHeadScoreProgression,
  buildMultiPlayerScoreProgression,
} from "./scoreProgression.js";
import type { AnalysisRun } from "./matchAnalysis.js";

function field(
  fieldType: string,
  score: number | null,
  scoredSequence: number | null,
  rollsUsed = 2,
) {
  return { fieldType, score, rollsUsed, scoredSequence };
}

function runWithScores(
  entries: Array<{ fieldType: string; score: number; scoredSequence: number }>,
): AnalysisRun {
  const fields = FIELD_TYPES_PER_GAME.map((fieldType) => {
    const hit = entries.find((e) => e.fieldType === fieldType);
    return field(
      fieldType,
      hit?.score ?? null,
      hit?.scoredSequence ?? null,
    );
  });
  const summary = computeGameBreakdown(fields, 0);
  return {
    gameCount: 1,
    useStrategyRules: true,
    totalScore: summary.gameTotal,
    totalRollsUsed: entries.length * 2,
    rollsInPool: 0,
    extraYatzyCount: 0,
    games: [{ index: 1, summary, fields }],
  };
}

describe("buildHeadToHeadScoreProgression", () => {
  it("liefert Verlauf mit Führungswechseln", () => {
    const runA = runWithScores([
      { fieldType: "ONES", score: 3, scoredSequence: 1 },
      { fieldType: "TWOS", score: 6, scoredSequence: 3 },
    ]);
    const runB = runWithScores([
      { fieldType: "ONES", score: 5, scoredSequence: 2 },
      { fieldType: "TWOS", score: 0, scoredSequence: 4 },
    ]);

    const chart = buildHeadToHeadScoreProgression(runA, runB, "a", "Alice", "b", "Bob");
    assert.ok(chart);
    assert.equal(chart!.players.length, 2);
    assert.equal(chart!.points[0]!.scores[0], 0);
    assert.equal(chart!.points[1]!.scores[0], 3);
    assert.equal(chart!.points[2]!.scores[1], 5);
    assert.ok(chart!.points.length >= 3);
    assert.equal(chart!.players[0]!.name, "Alice");
    assert.equal(chart!.players[1]!.name, "Bob");
  });

  it("gibt null zurück ohne Einträge", () => {
    const empty = runWithScores([]);
    const chart = buildHeadToHeadScoreProgression(empty, empty, "a", "A", "b", "B");
    assert.equal(chart, null);
  });
});

describe("buildMultiPlayerScoreProgression", () => {
  it("liefert Linien für drei Spieler inkl. Vorsprung", () => {
    const runA = runWithScores([{ fieldType: "ONES", score: 5, scoredSequence: 1 }]);
    const runB = runWithScores([{ fieldType: "ONES", score: 2, scoredSequence: 2 }]);
    const runC = runWithScores([{ fieldType: "ONES", score: 4, scoredSequence: 3 }]);

    const chart = buildMultiPlayerScoreProgression([
      { playerId: "a", playerName: "A", run: runA },
      { playerId: "b", playerName: "B", run: runB },
      { playerId: "c", playerName: "C", run: runC },
    ]);

    assert.ok(chart);
    assert.equal(chart!.players.length, 3);
    const last = chart!.points[chart!.points.length - 1]!;
    assert.equal(last.scores[0], 5);
    assert.equal(last.scores[1], 2);
    assert.equal(last.scores[2], 4);
    assert.equal(last.leaderIndex, 0);
    assert.equal(last.leadMargin, 1);
  });
});
