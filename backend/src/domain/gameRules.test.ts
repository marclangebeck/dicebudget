import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ROLLS_PER_FIELD } from "../config.js";
import { assertRollsUsedForMode, poolDeltaForComplete } from "./gameRules.js";

describe("poolDeltaForComplete", () => {
  it("returns no pool changes in classic mode", () => {
    assert.deepEqual(poolDeltaForComplete(1, false), { spareToPool: 0, poolCost: 0 });
    assert.deepEqual(poolDeltaForComplete(3, false), { spareToPool: 0, poolCost: 0 });
    assert.deepEqual(poolDeltaForComplete(10, false), { spareToPool: 0, poolCost: 0 });
  });

  it("adds spare rolls to pool for 1–3 rolls in strategy mode", () => {
    assert.deepEqual(poolDeltaForComplete(1, true), {
      spareToPool: ROLLS_PER_FIELD - 1,
      poolCost: 0,
    });
    assert.deepEqual(poolDeltaForComplete(3, true), { spareToPool: 0, poolCost: 0 });
  });

  it("consumes pool for extra rolls beyond three in strategy mode", () => {
    assert.deepEqual(poolDeltaForComplete(4, true), { spareToPool: 0, poolCost: 1 });
    assert.deepEqual(poolDeltaForComplete(6, true), { spareToPool: 0, poolCost: 3 });
  });
});

describe("assertRollsUsedForMode", () => {
  it("allows 1–3 rolls in classic mode", () => {
    assert.doesNotThrow(() => assertRollsUsedForMode(1, false));
    assert.doesNotThrow(() => assertRollsUsedForMode(3, false));
  });

  it("rejects more than three rolls in classic mode", () => {
    assert.throws(() => assertRollsUsedForMode(4, false), /1 to 3/);
  });

  it("allows any positive roll count in strategy mode", () => {
    assert.doesNotThrow(() => assertRollsUsedForMode(20, true));
    assert.doesNotThrow(() => assertRollsUsedForMode(23, true));
    assert.doesNotThrow(() => assertRollsUsedForMode(39, true));
  });

  it("rejects non-positive rolls", () => {
    assert.throws(() => assertRollsUsedForMode(0, true), /positive integer/);
  });
});
