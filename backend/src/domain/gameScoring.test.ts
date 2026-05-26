import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FIELD_TYPES_PER_GAME, type FieldTypeId } from "./fieldTypes.js";
import {
  UPPER_BONUS_MIN,
  UPPER_BONUS_POINTS,
  computeGameBreakdown,
  gameIndexForExtraYatzyClick,
} from "./gameScoring.js";

function fieldsWithScores(
  scores: Partial<Record<FieldTypeId, number>>,
): { fieldType: string; score: number | null }[] {
  return FIELD_TYPES_PER_GAME.map((fieldType) => ({
    fieldType,
    score: scores[fieldType] ?? null,
  }));
}

describe("computeGameBreakdown", () => {
  it("returns zeros for an empty sheet", () => {
    const b = computeGameBreakdown(fieldsWithScores({}));
    assert.equal(b.upperSum, 0);
    assert.equal(b.lowerSum, 0);
    assert.equal(b.bonus, null);
    assert.equal(b.ergebnisOben, null);
    assert.equal(b.gameTotal, 0);
  });

  it("grants +35 bonus when upper section sums to at least 63", () => {
    const b = computeGameBreakdown(
      fieldsWithScores({
        ONES: 5,
        TWOS: 10,
        THREES: 15,
        FOURS: 12,
        FIVES: 15,
        SIXES: 6,
      }),
    );
    assert.equal(b.upperSum, UPPER_BONUS_MIN);
    assert.equal(b.bonus, UPPER_BONUS_POINTS);
    assert.equal(b.ergebnisOben, UPPER_BONUS_MIN + UPPER_BONUS_POINTS);
    assert.equal(b.gameTotal, b.ergebnisOben);
  });

  it("grants no bonus when upper section is complete but below 63", () => {
    const b = computeGameBreakdown(
      fieldsWithScores({
        ONES: 0,
        TWOS: 0,
        THREES: 0,
        FOURS: 0,
        FIVES: 0,
        SIXES: 0,
      }),
    );
    assert.equal(b.upperSum, 0);
    assert.equal(b.bonus, 0);
    assert.equal(b.ergebnisOben, 0);
  });

  it("leaves bonus null until all upper fields are scored", () => {
    const b = computeGameBreakdown(
      fieldsWithScores({
        ONES: 5,
        TWOS: 10,
        CHANCE: 20,
      }),
    );
    assert.equal(b.upperSum, 15);
    assert.equal(b.bonus, null);
    assert.equal(b.ergebnisOben, null);
    assert.equal(b.lowerSum, 20);
    assert.equal(b.gameTotal, 35);
  });

  it("sums lower section into game total", () => {
    const b = computeGameBreakdown(
      fieldsWithScores({
        ONES: 3,
        TWOS: 4,
        THREES: 6,
        FOURS: 8,
        FIVES: 10,
        SIXES: 12,
        KNIFFEL: 50,
        CHANCE: 22,
      }),
    );
    assert.equal(b.lowerSum, 72);
    assert.ok(b.ergebnisOben !== null);
    assert.equal(b.gameTotal, b.ergebnisOben! + b.lowerSum);
  });

  it("adds extra yatzy bonus to game total", () => {
    const b = computeGameBreakdown(
      fieldsWithScores({
        ONES: 1,
        KNIFFEL: 50,
      }),
      100,
    );
    assert.equal(b.extraYatzyBonus, 100);
    assert.equal(b.gameTotal, b.lowerSum + b.upperSum + 100);
  });
});

describe("gameIndexForExtraYatzyClick", () => {
  it("rotates across game columns", () => {
    assert.equal(gameIndexForExtraYatzyClick(1, 3), 1);
    assert.equal(gameIndexForExtraYatzyClick(2, 3), 2);
    assert.equal(gameIndexForExtraYatzyClick(3, 3), 3);
    assert.equal(gameIndexForExtraYatzyClick(4, 3), 1);
  });
});
