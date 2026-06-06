import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzePlayerRun,
  buildMatchAnalysis,
  type AnalysisRun,
} from "./matchAnalysis.js";
import { computeGameBreakdown } from "./gameScoring.js";
import { FIELD_TYPES_PER_GAME } from "./fieldTypes.js";

function emptyRun(overrides: Partial<AnalysisRun> = {}): AnalysisRun {
  const games = (overrides.games ?? [
    {
      index: 1,
      summary: computeGameBreakdown([], 0),
      fields: FIELD_TYPES_PER_GAME.map((fieldType) => ({
        fieldType,
        score: null,
        rollsUsed: 0,
      })),
    },
  ]).map((g) => ({
    ...g,
    summary: g.summary ?? computeGameBreakdown(g.fields, 0),
  }));

  return {
    gameCount: 1,
    useStrategyRules: true,
    totalScore: 0,
    totalRollsUsed: 0,
    rollsInPool: 0,
    extraYatzyCount: 0,
    games,
    ...overrides,
  };
}

describe("analyzePlayerRun", () => {
  it("zählt Bonus und Pool-Kennzahlen", () => {
    const upperFields = FIELD_TYPES_PER_GAME.slice(0, 6).map((fieldType) => ({
      fieldType,
      score: fieldType === "ONES" ? 3 : fieldType === "TWOS" ? 6 : fieldType === "THREES" ? 9 : fieldType === "FOURS" ? 12 : fieldType === "FIVES" ? 15 : 18,
      rollsUsed: 2,
    }));
    const lowerFields = FIELD_TYPES_PER_GAME.slice(6).map((fieldType) => ({
      fieldType,
      score: fieldType === "KNIFFEL" ? 50 : fieldType === "CHANCE" ? 20 : 0,
      rollsUsed: fieldType === "CHANCE" ? 5 : 3,
    }));
    const fields = [...upperFields, ...lowerFields];
    const summary = computeGameBreakdown(fields, 0);
    const run = emptyRun({
      totalScore: summary.gameTotal,
      rollsInPool: 4,
      games: [{ index: 1, summary, fields }],
    });
    const m = analyzePlayerRun(run);
    assert.equal(m.bonusCount, 1);
    assert.equal(m.yatzyHits, 1);
    assert.equal(m.poolSpared, 6);
    assert.equal(m.poolSpent, 2);
    assert.ok(m.pointsPerPoolRoll != null && m.pointsPerPoolRoll > 0);
  });
});

describe("buildMatchAnalysis", () => {
  it("liefert Head-to-Head bei zwei Runs", () => {
    const viewerRun = emptyRun({ totalScore: 200, rollsInPool: 10 });
    const opponentRun = emptyRun({ totalScore: 180, rollsInPool: 5 });
    const result = buildMatchAnalysis({
      mode: "multi",
      ready: true,
      viewerRun,
      opponentRun,
      allRuns: [viewerRun, opponentRun],
    });
    assert.equal(result.mode, "multi");
    assert.ok(result.headToHead);
    assert.equal(result.headToHead!.scoreDiff, 20);
    assert.equal(result.headToHead!.winner, "viewer");
    assert.ok(result.insights.length > 0);
  });

  it("liefert Solo-Insights ohne Gegner", () => {
    const run = emptyRun({ totalScore: 150, rollsInPool: 3 });
    const result = buildMatchAnalysis({
      mode: "solo",
      ready: true,
      viewerRun: run,
    });
    assert.equal(result.mode, "solo");
    assert.equal(result.headToHead, null);
    assert.ok(result.insights.length > 0);
  });
});
