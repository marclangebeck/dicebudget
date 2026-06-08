import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeGameBreakdown } from "./gameScoring.js";
import { FIELD_TYPES_PER_GAME } from "./fieldTypes.js";
import { buildHeadToHeadScoreProgression } from "./scoreProgression.js";
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
    assert.equal(chart!.points[0]!.playerAScore, 0);
    assert.equal(chart!.points[1]!.playerAScore, 3);
    assert.equal(chart!.points[2]!.playerBScore, 5);
    assert.ok(chart!.points.length >= 3);
    assert.equal(chart!.playerAName, "Alice");
    assert.equal(chart!.playerBName, "Bob");
  });

  it("gibt null zurück ohne Einträge", () => {
    const empty = runWithScores([]);
    const chart = buildHeadToHeadScoreProgression(empty, empty, "a", "A", "b", "B");
    assert.equal(chart, null);
  });
});
