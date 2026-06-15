import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BURN_POOL_COST,
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
});
