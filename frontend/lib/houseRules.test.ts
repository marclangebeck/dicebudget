import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BURN_POOL_COST,
  BURN_POOL_COST_SET_FACE,
  burnPoolCost,
  canBurnHouseRule,
  isFieldTypeRowFull,
  poolAfterFullLoss,
  poolAfterPlayerShareLoss,
  qualifiesYatzyStreakPenalty,
  qualifiesYatzyTriplePenalty,
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

  it("BURN_POOL_COST und burnPoolCost", () => {
    assert.equal(BURN_POOL_COST, 1);
    assert.equal(burnPoolCost("reroll"), 1);
    assert.equal(burnPoolCost("set_face"), BURN_POOL_COST_SET_FACE);
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

  it("countOpenUpperFields über mehrere Spiele", async () => {
    const { countOpenUpperFields, isRunUpperComplete } = await import("./houseRules.js");
    const games = [
      {
        fields: [
          { fieldType: "ONES" as const, score: 3 },
          { fieldType: "TWOS" as const, score: null },
          { fieldType: "KNIFFEL" as const, score: null },
        ],
      },
      {
        fields: [
          { fieldType: "ONES" as const, score: null },
          { fieldType: "TWOS" as const, score: 4 },
        ],
      },
    ];
    assert.equal(countOpenUpperFields(games), 2);
    assert.equal(isRunUpperComplete(games), false);
  });

  it("qualifiesYatzyStreakPenalty nur bei Score 50", () => {
    assert.equal(
      qualifiesYatzyStreakPenalty([
        { fieldType: "KNIFFEL", score: 50, rollsUsed: 2, scoredSequence: 1 },
        { fieldType: "KNIFFEL", score: 50, rollsUsed: 3, scoredSequence: 2 },
      ]),
      true,
    );
    assert.equal(
      qualifiesYatzyStreakPenalty([
        { fieldType: "KNIFFEL", score: 0, rollsUsed: 2, scoredSequence: 1 },
        { fieldType: "KNIFFEL", score: 0, rollsUsed: 3, scoredSequence: 2 },
      ]),
      false,
    );
  });

  it("qualifiesYatzyTriplePenalty nur bei drei Treffern 50", () => {
    assert.equal(
      qualifiesYatzyTriplePenalty([
        { fieldType: "KNIFFEL", score: 50, rollsUsed: 1, scoredSequence: 1 },
        { fieldType: "KNIFFEL", score: 50, rollsUsed: 2, scoredSequence: 2 },
        { fieldType: "KNIFFEL", score: 50, rollsUsed: 3, scoredSequence: 3 },
      ]),
      true,
    );
    assert.equal(
      qualifiesYatzyTriplePenalty([
        { fieldType: "KNIFFEL", score: 50, rollsUsed: 1, scoredSequence: 1 },
        { fieldType: "KNIFFEL", score: 50, rollsUsed: 2, scoredSequence: 2 },
        { fieldType: "KNIFFEL", score: 0, rollsUsed: 3, scoredSequence: 3 },
      ]),
      false,
    );
  });

  it("poolAfterPlayerShareLoss skaliert mit Spielerzahl", () => {
    assert.deepEqual(poolAfterPlayerShareLoss(10, 2), { newPool: 5, poolsLost: 5 });
    assert.deepEqual(poolAfterPlayerShareLoss(12, 3), { newPool: 8, poolsLost: 4 });
    assert.deepEqual(poolAfterFullLoss(7), { newPool: 0, poolsLost: 7 });
  });
});
