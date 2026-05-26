import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  InvalidFieldScoreError,
  assertValidScoreForField,
  fieldScoreChoices,
  isValidScoreForField,
} from "./fieldScores.js";

describe("fieldScoreChoices", () => {
  it("lists upper-section multiples", () => {
    assert.deepEqual(fieldScoreChoices("THREES"), [0, 3, 6, 9, 12, 15]);
  });

  it("lists fixed combo scores", () => {
    assert.deepEqual(fieldScoreChoices("KNIFFEL"), [50, 0]);
  });

  it("lists 0–30 for sum-based lower fields", () => {
    const choices = fieldScoreChoices("CHANCE");
    assert.equal(choices.length, 31);
    assert.equal(choices[0], 0);
    assert.equal(choices[30], 30);
  });
});

describe("isValidScoreForField", () => {
  it("accepts UI-allowed values", () => {
    assert.equal(isValidScoreForField("ONES", 3), true);
    assert.equal(isValidScoreForField("FULL_HOUSE", 25), true);
    assert.equal(isValidScoreForField("CHANCE", 22), true);
  });

  it("rejects values outside the allowed set", () => {
    assert.equal(isValidScoreForField("ONES", 7), false);
    assert.equal(isValidScoreForField("KNIFFEL", 99), false);
  });
});

describe("assertValidScoreForField", () => {
  it("throws InvalidFieldScoreError for disallowed scores", () => {
    assert.throws(
      () => assertValidScoreForField("ONES", 7),
      (err: unknown) => err instanceof InvalidFieldScoreError,
    );
  });

  it("does not throw for allowed scores", () => {
    assert.doesNotThrow(() => assertValidScoreForField("SIXES", 24));
  });
});
