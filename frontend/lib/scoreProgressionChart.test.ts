import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  downsampleScoreProgressionPoints,
  normalizeScoreProgression,
} from "@/lib/scoreProgressionChart";

describe("downsampleScoreProgressionPoints", () => {
  it("samples every 10 percent", () => {
    const points = Array.from({ length: 21 }, (_, turn) => ({
      turn,
      scores: [turn * 10, turn * 5],
      leaderIndex: 0 as number | null,
      leadMargin: turn * 5,
    }));

    const sampled = downsampleScoreProgressionPoints(points);
    assert.equal(sampled.length, 11);
    assert.equal(sampled[0]?.turn, 0);
    assert.equal(sampled[10]?.turn, 100);
    assert.equal(sampled[5]?.scores[0], 100);
  });

  it("tolerates missing input", () => {
    assert.deepEqual(downsampleScoreProgressionPoints(undefined), []);
  });
});

describe("normalizeScoreProgression", () => {
  it("accepts new multi-player format", () => {
    const normalized = normalizeScoreProgression({
      players: [
        { id: "a", name: "Alice" },
        { id: "b", name: "Bob" },
      ],
      points: [
        { turn: 0, scores: [0, 0], leaderIndex: null, leadMargin: 0 },
        { turn: 1, scores: [12, 8], leaderIndex: 0, leadMargin: 4 },
      ],
      finalLeaderIndex: 0,
      leadChanges: 0,
    });
    assert.ok(normalized);
    assert.equal(normalized!.players.length, 2);
    assert.equal(normalized!.points[1]?.scores[1], 8);
  });

  it("converts legacy two-player format", () => {
    const normalized = normalizeScoreProgression({
      playerAId: "a",
      playerAName: "Alice",
      playerBId: "b",
      playerBName: "Bob",
      points: [
        { turn: 0, playerAScore: 0, playerBScore: 0, leader: "tie" },
        { turn: 1, playerAScore: 20, playerBScore: 15, leader: "a" },
        { turn: 2, playerAScore: 20, playerBScore: 25, leader: "b" },
      ],
      finalLeader: "b",
      leadChanges: 1,
    });
    assert.ok(normalized);
    assert.equal(normalized!.players[0]?.name, "Alice");
    assert.equal(normalized!.points[2]?.scores[1], 25);
    assert.equal(normalized!.points[2]?.leaderIndex, 1);
    assert.equal(normalized!.finalLeaderIndex, 1);
    assert.equal(normalized!.leadChanges, 1);
  });

  it("returns null for invalid payloads", () => {
    assert.equal(normalizeScoreProgression(null), null);
    assert.equal(normalizeScoreProgression({ players: [], points: [] }), null);
  });
});
