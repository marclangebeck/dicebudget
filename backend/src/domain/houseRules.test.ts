import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BURN_POOL_COST,
  BURN_POOL_COST_SET_FACE,
  burnPoolCost,
  gameColumnHasFullCombo,
  gameColumnHasLowerComplete,
  gameColumnHasUpperBonus,
  hasAnyFullFieldTypeRow,
  halvePoolRoundedDown,
  isFieldTypeRowFull,
  isValidRollSaleScore,
  newlyAchievedColumnGoal,
  poolAfterFullLoss,
  poolAfterPlayerShareLoss,
  qualifiesYatzyStreakPenalty,
  qualifiesYatzyTriplePenalty,
  rollSaleAllowedScores,
  runHasAnyColumnUpperBonus,
} from "./houseRules.js";

describe("houseRules", () => {
  it("rollSaleAllowedScores oben nur 4× Augenzahl", () => {
    assert.deepEqual(rollSaleAllowedScores("FOURS"), [16]);
    assert.deepEqual(rollSaleAllowedScores("SIXES"), [24]);
  });

  it("rollSaleAllowedScores unten max Werte", () => {
    assert.deepEqual(rollSaleAllowedScores("THREE_OF_A_KIND"), [30]);
    assert.deepEqual(rollSaleAllowedScores("FULL_HOUSE"), [25]);
    assert.deepEqual(rollSaleAllowedScores("KNIFFEL"), []);
  });

  it("isValidRollSaleScore", () => {
    assert.equal(isValidRollSaleScore("FIVES", 20), true);
    assert.equal(isValidRollSaleScore("FIVES", 15), false);
  });

  it("isFieldTypeRowFull wenn alle Spalten einer Zeile voll", () => {
    const games = [
      {
        fields: [
          { fieldType: "LARGE_STRAIGHT", score: 40 },
          { fieldType: "ONES", score: null },
        ],
      },
      {
        fields: [
          { fieldType: "LARGE_STRAIGHT", score: 0 },
          { fieldType: "ONES", score: 3 },
        ],
      },
    ];
    assert.equal(isFieldTypeRowFull(games, "LARGE_STRAIGHT"), true);
    assert.equal(isFieldTypeRowFull(games, "ONES"), false);
    assert.equal(hasAnyFullFieldTypeRow(games), true);
  });

  it("qualifiesYatzyStreakPenalty bei zwei Alle Fünfe 50 ≤3", () => {
    const fields = [
      { fieldType: "ONES", score: 3, rollsUsed: 2, scoredSequence: 1 },
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 3, scoredSequence: 2 },
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 2, scoredSequence: 3 },
    ];
    assert.equal(qualifiesYatzyStreakPenalty(fields), true);
  });

  it("qualifiesYatzyStreakPenalty nicht bei Null-Einträgen", () => {
    const fields = [
      { fieldType: "KNIFFEL", score: 0, rollsUsed: 2, scoredSequence: 1 },
      { fieldType: "KNIFFEL", score: 0, rollsUsed: 3, scoredSequence: 2 },
    ];
    assert.equal(qualifiesYatzyStreakPenalty(fields), false);
  });

  it("qualifiesYatzyStreakPenalty nicht bei 50 dann 0", () => {
    const fields = [
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 2, scoredSequence: 1 },
      { fieldType: "KNIFFEL", score: 0, rollsUsed: 3, scoredSequence: 2 },
    ];
    assert.equal(qualifiesYatzyStreakPenalty(fields), false);
  });

  it("qualifiesYatzyTriplePenalty nur bei drei Treffern 50", () => {
    const hit = [
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 1, scoredSequence: 1 },
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 2, scoredSequence: 2 },
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 3, scoredSequence: 3 },
    ];
    const withZero = [
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 1, scoredSequence: 1 },
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 2, scoredSequence: 2 },
      { fieldType: "KNIFFEL", score: 0, rollsUsed: 3, scoredSequence: 3 },
    ];
    assert.equal(qualifiesYatzyTriplePenalty(hit), true);
    assert.equal(qualifiesYatzyTriplePenalty(withZero), false);
  });

  it("gameColumnHasUpperBonus braucht Summe ≥ 63", () => {
    const withBonus = [
      { fieldType: "ONES", score: 3 },
      { fieldType: "TWOS", score: 6 },
      { fieldType: "THREES", score: 9 },
      { fieldType: "FOURS", score: 12 },
      { fieldType: "FIVES", score: 15 },
      { fieldType: "SIXES", score: 18 },
    ];
    const withoutBonus = [
      { fieldType: "ONES", score: 1 },
      { fieldType: "TWOS", score: 2 },
      { fieldType: "THREES", score: 3 },
      { fieldType: "FOURS", score: 4 },
      { fieldType: "FIVES", score: 5 },
      { fieldType: "SIXES", score: 6 },
    ];
    assert.equal(gameColumnHasUpperBonus(withBonus), true);
    assert.equal(gameColumnHasUpperBonus(withoutBonus), false);
  });

  it("gameColumnHasLowerComplete und FullCombo", () => {
    const lower = [
      { fieldType: "THREE_OF_A_KIND", score: 20 },
      { fieldType: "FOUR_OF_A_KIND", score: 24 },
      { fieldType: "FULL_HOUSE", score: 25 },
      { fieldType: "SMALL_STRAIGHT", score: 30 },
      { fieldType: "LARGE_STRAIGHT", score: 40 },
      { fieldType: "KNIFFEL", score: 50 },
      { fieldType: "CHANCE", score: 20 },
    ];
    const upperBonus = [
      { fieldType: "ONES", score: 3 },
      { fieldType: "TWOS", score: 6 },
      { fieldType: "THREES", score: 9 },
      { fieldType: "FOURS", score: 12 },
      { fieldType: "FIVES", score: 15 },
      { fieldType: "SIXES", score: 18 },
    ];
    assert.equal(gameColumnHasLowerComplete(lower), true);
    assert.equal(gameColumnHasFullCombo([...upperBonus, ...lower]), true);
    assert.equal(gameColumnHasFullCombo(upperBonus), false);
  });

  it("newlyAchievedColumnGoal", () => {
    const empty = [{ fields: [{ fieldType: "ONES", score: null }] }];
    const fullUpper = [
      {
        fields: [
          { fieldType: "ONES", score: 3 },
          { fieldType: "TWOS", score: 6 },
          { fieldType: "THREES", score: 9 },
          { fieldType: "FOURS", score: 12 },
          { fieldType: "FIVES", score: 15 },
          { fieldType: "SIXES", score: 18 },
        ],
      },
    ];
    assert.equal(
      newlyAchievedColumnGoal(empty, fullUpper, runHasAnyColumnUpperBonus),
      true,
    );
    assert.equal(
      newlyAchievedColumnGoal(fullUpper, fullUpper, runHasAnyColumnUpperBonus),
      false,
    );
  });

  it("BURN_POOL_COST und burnPoolCost", () => {
    assert.equal(BURN_POOL_COST, 1);
    assert.equal(burnPoolCost("reroll"), 1);
    assert.equal(burnPoolCost("set_face"), BURN_POOL_COST_SET_FACE);
  });

  it("poolAfterPlayerShareLoss: n=2 bleibt Halbieren", () => {
    assert.equal(poolAfterPlayerShareLoss(10, 2).newPool, 5);
    assert.equal(poolAfterPlayerShareLoss(10, 2).poolsLost, 5);
    assert.equal(poolAfterPlayerShareLoss(5, 2).newPool, 2);
    assert.equal(poolAfterPlayerShareLoss(5, 2).poolsLost, 3);
    assert.equal(halvePoolRoundedDown(5), 2);
    assert.equal(poolAfterPlayerShareLoss(12, 3).poolsLost, 4);
    assert.equal(poolAfterPlayerShareLoss(12, 3).newPool, 8);
    assert.equal(poolAfterPlayerShareLoss(10, 4).poolsLost, 3);
    assert.equal(poolAfterPlayerShareLoss(10, 4).newPool, 7);
    assert.equal(poolAfterFullLoss(9).poolsLost, 9);
    assert.equal(poolAfterFullLoss(9).newPool, 0);
  });
});
