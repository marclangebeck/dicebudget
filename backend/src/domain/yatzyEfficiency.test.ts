import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidYatzyEfficiencyScore,
  yatzyEfficiencyHitScore,
  yatzyEfficiencyScoreChoices,
} from "./yatzyEfficiency.js";

describe("yatzyEfficiencyHitScore", () => {
  it("volle 50 bis Wurf 7", () => {
    for (let rolls = 1; rolls <= 7; rolls += 1) {
      assert.equal(yatzyEfficiencyHitScore(rolls), 50);
    }
  });

  it("stuft alle 3 Würfe um −5 ab", () => {
    assert.equal(yatzyEfficiencyHitScore(8), 45);
    assert.equal(yatzyEfficiencyHitScore(10), 45);
    assert.equal(yatzyEfficiencyHitScore(11), 40);
    assert.equal(yatzyEfficiencyHitScore(13), 40);
    assert.equal(yatzyEfficiencyHitScore(14), 35);
    assert.equal(yatzyEfficiencyHitScore(17), 30);
  });

  it("endet bei 0", () => {
    assert.equal(yatzyEfficiencyHitScore(37), 0);
  });
});

describe("isValidYatzyEfficiencyScore", () => {
  it("erlaubt 0 und passenden Treffer", () => {
    assert.equal(isValidYatzyEfficiencyScore(0, 12), true);
    assert.equal(isValidYatzyEfficiencyScore(40, 12), true);
    assert.equal(isValidYatzyEfficiencyScore(50, 12), false);
  });
});

describe("yatzyEfficiencyScoreChoices", () => {
  it("liefert Treffer und 0", () => {
    assert.deepEqual(yatzyEfficiencyScoreChoices(9), [45, 0]);
  });
});
