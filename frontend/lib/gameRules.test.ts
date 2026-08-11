import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strategyRollChipOptions } from "./gameRules.js";

describe("strategyRollChipOptions", () => {
  it("bietet nur 1–3 ohne Pool", () => {
    assert.deepEqual(strategyRollChipOptions(0), [1, 2, 3]);
  });

  it("erweitert bis Pool reicht", () => {
    assert.deepEqual(strategyRollChipOptions(5), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.deepEqual(strategyRollChipOptions(20), [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    ]);
  });

  it("optionale Obergrenze kann weiter einschränken (ohne Fake-Minimum 1)", () => {
    assert.deepEqual(strategyRollChipOptions(20, 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(strategyRollChipOptions(5, 23), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.deepEqual(strategyRollChipOptions(5, 0), []);
  });
});
