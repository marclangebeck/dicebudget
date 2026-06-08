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
  it("liefert Head-to-Head bei zwei Spielern", () => {
    const viewerRun = emptyRun({ totalScore: 200, rollsInPool: 10 });
    const opponentRun = emptyRun({ totalScore: 180, rollsInPool: 5 });
    const result = buildMatchAnalysis({
      mode: "multi",
      ready: true,
      viewerPlayerId: "viewer",
      participants: [
        { playerId: "viewer", playerName: "A", orderIndex: 1, run: viewerRun },
        { playerId: "opp", playerName: "B", orderIndex: 2, run: opponentRun },
      ],
    });
    assert.equal(result.mode, "multi");
    assert.equal(result.playerCount, 2);
    assert.ok(result.headToHead);
    assert.equal(result.comparisons.length, 1);
    assert.equal(result.headToHead!.scoreDiff, 20);
    assert.equal(result.viewerRank, 1);
    assert.ok(result.insights.length > 0);
    assert.ok(result.coaching.narrative.length > 0);
    assert.ok(result.coaching.tips.length > 0);
  });

  it("liefert Ranking und mehrere Direktvergleiche bei 3 Spielern", () => {
    const runs = [
      emptyRun({ totalScore: 300 }),
      emptyRun({ totalScore: 250 }),
      emptyRun({ totalScore: 200 }),
    ];
    const result = buildMatchAnalysis({
      mode: "multi",
      ready: true,
      viewerPlayerId: "p2",
      participants: [
        { playerId: "p1", playerName: "A", orderIndex: 1, run: runs[0]! },
        { playerId: "p2", playerName: "B", orderIndex: 2, run: runs[1]! },
        { playerId: "p3", playerName: "C", orderIndex: 3, run: runs[2]! },
      ],
    });
    assert.equal(result.playerCount, 3);
    assert.equal(result.comparisons.length, 2);
    assert.equal(result.viewerRank, 2);
    assert.equal(result.pointsBehindLeader, 50);
    assert.equal(result.directWins, 1);
    assert.equal(result.directLosses, 1);
    assert.equal(result.ranking[0]!.playerId, "p1");
    assert.equal(result.headToHead, null);
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
    assert.ok(result.coaching.narrative.length > 0);
  });
});
