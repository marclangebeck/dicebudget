import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  UPPER_BONUS_MIN,
  UPPER_BONUS_POINTS,
  computeGameBreakdown,
  gameIndexForExtraYatzyClick,
  upperBonusAchieved,
  upperBonusDelta,
} from "./gameScoring.js";

const upperFields = (scores: Record<string, number | null>) =>
  Object.entries(scores).map(([fieldType, score]) => ({ fieldType, score }));

describe("upperBonusDelta", () => {
  it("ist 0 wenn jede Augenzahl exakt 3× getroffen wird", () => {
    const fields = upperFields({
      ONES: 3,
      TWOS: 6,
      THREES: 9,
    });
    assert.equal(upperBonusDelta(fields), 0);
  });

  it("ist negativ unter der Soll-Marke", () => {
    const fields = upperFields({ ONES: 1 });
    assert.equal(upperBonusDelta(fields), -2);
  });

  it("ist positiv über der Soll-Marke", () => {
    const fields = upperFields({ SIXES: 24 });
    assert.equal(upperBonusDelta(fields), 6);
  });
});

describe("computeGameBreakdown", () => {
  it("setzt ergebnisOben und Bonus bei vollständiger oberer Sektion ≥ 63", () => {
    const fields = upperFields({
      ONES: 3,
      TWOS: 6,
      THREES: 9,
      FOURS: 12,
      FIVES: 15,
      SIXES: 18,
    });
    const breakdown = computeGameBreakdown(fields);
    assert.equal(breakdown.upperSum, UPPER_BONUS_MIN);
    assert.equal(breakdown.bonus, UPPER_BONUS_POINTS);
    assert.equal(breakdown.ergebnisOben, UPPER_BONUS_MIN + UPPER_BONUS_POINTS);
    assert.equal(breakdown.gameTotal, breakdown.ergebnisOben);
  });

  it("setzt Bonus 0 wenn obere Sektion voll aber unter 63", () => {
    const fields = upperFields({
      ONES: 0,
      TWOS: 0,
      THREES: 0,
      FOURS: 0,
      FIVES: 0,
      SIXES: 0,
    });
    const breakdown = computeGameBreakdown(fields);
    assert.equal(breakdown.bonus, 0);
    assert.equal(breakdown.ergebnisOben, 0);
  });

  it("lässt Bonus null solange obere Felder fehlen", () => {
    const fields = upperFields({ ONES: 3, TWOS: 6 });
    const breakdown = computeGameBreakdown(fields);
    assert.equal(breakdown.bonus, null);
    assert.equal(breakdown.ergebnisOben, null);
    assert.equal(breakdown.gameTotal, 9);
  });
});

describe("upperBonusAchieved", () => {
  it("ist true nur bei allen 6 oberen Feldern und Summe ≥ 63", () => {
    const ok = upperFields({
      ONES: 3,
      TWOS: 6,
      THREES: 9,
      FOURS: 12,
      FIVES: 15,
      SIXES: 18,
    });
    assert.equal(upperBonusAchieved(ok), true);

    const tooLow = upperFields({
      ONES: 0,
      TWOS: 0,
      THREES: 0,
      FOURS: 0,
      FIVES: 0,
      SIXES: 0,
    });
    assert.equal(upperBonusAchieved(tooLow), false);

    assert.equal(upperBonusAchieved(upperFields({ ONES: 3 })), false);
  });
});

describe("gameIndexForExtraYatzyClick", () => {
  it("rotiert Zielspiel über gameCount", () => {
    assert.equal(gameIndexForExtraYatzyClick(1, 3), 1);
    assert.equal(gameIndexForExtraYatzyClick(2, 3), 2);
    assert.equal(gameIndexForExtraYatzyClick(3, 3), 3);
    assert.equal(gameIndexForExtraYatzyClick(4, 3), 1);
  });

  it("wirft bei ungültigen Parametern", () => {
    assert.throws(
      () => gameIndexForExtraYatzyClick(0, 2),
      /invalid extra Alle Fünfe assignment/,
    );
  });
});
