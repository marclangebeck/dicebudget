import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldPlayFirstRollReward } from "./achievementSound.js";

describe("shouldPlayFirstRollReward", () => {
  const base = {
    useStrategyRules: true,
    rollsUsed: 1,
    score: 12,
    isCorrection: false,
    rollSaleEntry: false,
    hasAchievement: false,
  };

  it("spielt bei Strategy-Einswurf mit positivem Score", () => {
    assert.equal(shouldPlayFirstRollReward(base), true);
  });

  it("nicht bei Score 0, Korrektur, Verkauf, Achievement oder 2 Würfen", () => {
    assert.equal(shouldPlayFirstRollReward({ ...base, score: 0 }), false);
    assert.equal(shouldPlayFirstRollReward({ ...base, isCorrection: true }), false);
    assert.equal(shouldPlayFirstRollReward({ ...base, rollSaleEntry: true }), false);
    assert.equal(shouldPlayFirstRollReward({ ...base, hasAchievement: true }), false);
    assert.equal(shouldPlayFirstRollReward({ ...base, rollsUsed: 2 }), false);
    assert.equal(shouldPlayFirstRollReward({ ...base, useStrategyRules: false }), false);
  });
});
