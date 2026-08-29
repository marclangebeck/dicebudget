import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { downsampleScoreProgressionPoints } from "@/lib/scoreProgressionChart";

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
});
