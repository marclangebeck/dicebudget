import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BURN_POOL_COST,
  hasAnyFullFieldTypeRow,
  isFieldTypeRowFull,
  isValidRollSaleScore,
  qualifiesYatzyStreakPenalty,
  rollSaleAllowedScores,
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

  it("qualifiesYatzyStreakPenalty bei zwei Alle Fünfe ≤3", () => {
    const fields = [
      { fieldType: "ONES", score: 3, rollsUsed: 2, scoredSequence: 1 },
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 3, scoredSequence: 2 },
      { fieldType: "KNIFFEL", score: 50, rollsUsed: 2, scoredSequence: 3 },
    ];
    assert.equal(qualifiesYatzyStreakPenalty(fields), true);
  });

  it("BURN_POOL_COST ist 1", () => {
    assert.equal(BURN_POOL_COST, 1);
  });
});
