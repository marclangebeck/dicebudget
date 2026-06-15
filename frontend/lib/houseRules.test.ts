import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BURN_POOL_COST,
  canBurnHouseRule,
  isFieldTypeRowFull,
  rollSaleAllowedScores,
} from "./houseRules.js";

describe("houseRules (frontend)", () => {
  it("rollSaleAllowedScores FOURS", () => {
    assert.deepEqual(rollSaleAllowedScores("FOURS"), [16]);
  });

  it("isFieldTypeRowFull", () => {
    const games = [
      { fields: [{ fieldType: "FOUR_OF_A_KIND" as const, score: 20 }] },
      { fields: [{ fieldType: "FOUR_OF_A_KIND" as const, score: 24 }] },
    ];
    assert.equal(isFieldTypeRowFull(games, "FOUR_OF_A_KIND"), true);
  });

  it("BURN_POOL_COST", () => {
    assert.equal(BURN_POOL_COST, 5);
  });

  it("canBurnHouseRule bei leerem Feld vor Eintrag", () => {
    const run = {
      status: "ACTIVE",
      useStrategyRules: true,
      rollsInPool: 5,
      games: [{ fields: [{ id: "f1", score: null, rollsUsed: 0 }] }],
    } as Parameters<typeof canBurnHouseRule>[0];
    assert.equal(canBurnHouseRule(run, "f1", false), true);
    assert.equal(canBurnHouseRule(run, "f1", true), false);
    assert.equal(canBurnHouseRule(run, null, false), false);
  });
});
