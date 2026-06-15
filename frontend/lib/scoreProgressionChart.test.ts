import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { downsampleScoreProgressionPoints } from "@/lib/scoreProgressionChart";

describe("downsampleScoreProgressionPoints", () => {
  it("samples every 10 percent", () => {
    const points = Array.from({ length: 21 }, (_, turn) => ({
      turn,
      playerAScore: turn * 10,
      playerBScore: turn * 5,
      leader: "a" as const,
    }));

    const sampled = downsampleScoreProgressionPoints(points);
    assert.equal(sampled.length, 11);
    assert.equal(sampled[0]?.turn, 0);
    assert.equal(sampled[10]?.turn, 100);
    assert.equal(sampled[5]?.playerAScore, 100);
  });
});
