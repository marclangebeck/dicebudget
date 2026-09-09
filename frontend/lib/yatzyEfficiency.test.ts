import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidYatzyEfficiencyScore,
  yatzyEfficiencyHitScore,
  yatzyEfficiencyScoreChoices,
} from "@/lib/yatzyEfficiency";

describe("yatzyEfficiencyHitScore", () => {
  it("volle 50 bis Wurf 7", () => {
    assert.equal(yatzyEfficiencyHitScore(7), 50);
    assert.equal(yatzyEfficiencyHitScore(8), 45);
    assert.equal(yatzyEfficiencyHitScore(11), 40);
  });

  it("validiert Treffer gegen Würfe", () => {
    assert.equal(isValidYatzyEfficiencyScore(45, 9), true);
    assert.equal(isValidYatzyEfficiencyScore(50, 9), false);
    assert.deepEqual(yatzyEfficiencyScoreChoices(14), [35, 0]);
  });
});
