import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FieldTypeId } from "./types.js";
import {
  detectNewlyCompletedFieldRows,
  detectNewlyCompletedGameColumns,
  detectSheetFuseHighlight,
  fieldShouldGoldFlash,
  isGameColumnComplete,
} from "./sheetFuseHighlight.js";

const ALL: FieldTypeId[] = [
  "ONES",
  "TWOS",
  "THREES",
  "FOURS",
  "FIVES",
  "SIXES",
  "THREE_OF_A_KIND",
  "FOUR_OF_A_KIND",
  "FULL_HOUSE",
  "SMALL_STRAIGHT",
  "LARGE_STRAIGHT",
  "KNIFFEL",
  "CHANCE",
];

function field(fieldType: FieldTypeId, score: number | null) {
  return { fieldType, score };
}

function gameWith(
  index: number,
  scores: Partial<Record<FieldTypeId, number | null>>,
) {
  return {
    index,
    fields: ALL.map((ft) => field(ft, scores[ft] ?? null)),
  };
}

function fullScores(except?: FieldTypeId): Partial<Record<FieldTypeId, number | null>> {
  const out: Partial<Record<FieldTypeId, number | null>> = {};
  for (const ft of ALL) {
    out[ft] = except === ft ? null : 1;
  }
  return out;
}

describe("isGameColumnComplete", () => {
  it("false wenn ein Feld offen", () => {
    assert.equal(isGameColumnComplete(gameWith(1, fullScores("CHANCE"))), false);
  });

  it("true wenn alle 13 Felder gesetzt", () => {
    assert.equal(isGameColumnComplete(gameWith(1, fullScores())), true);
  });
});

describe("detectNewlyCompletedFieldRows", () => {
  it("erkennt Full-House-Zeile über alle Spiele", () => {
    const before = [
      gameWith(1, { FULL_HOUSE: 25 }),
      gameWith(2, { FULL_HOUSE: null }),
    ];
    const after = [
      gameWith(1, { FULL_HOUSE: 25 }),
      gameWith(2, { FULL_HOUSE: 25 }),
    ];
    assert.deepEqual(detectNewlyCompletedFieldRows(before, after), ["FULL_HOUSE"]);
  });

  it("kein erneutes Highlight wenn schon voll", () => {
    const games = [
      gameWith(1, { ONES: 3 }),
      gameWith(2, { ONES: 2 }),
    ];
    assert.deepEqual(detectNewlyCompletedFieldRows(games, games), []);
  });
});

describe("detectNewlyCompletedGameColumns", () => {
  it("erkennt fertige Spalte", () => {
    const before = [gameWith(1, fullScores("CHANCE"))];
    const after = [gameWith(1, fullScores())];
    assert.deepEqual(detectNewlyCompletedGameColumns(before, after), [1]);
  });

  it("kein Highlight für schon fertige Spalte", () => {
    const games = [gameWith(1, fullScores())];
    assert.deepEqual(detectNewlyCompletedGameColumns(games, games), []);
  });
});

describe("detectSheetFuseHighlight", () => {
  it("kombiniert Zeile und Spalte", () => {
    const before = [
      gameWith(1, { ...fullScores("ONES"), ONES: null }),
      gameWith(2, { ONES: 2 }),
    ];
    const after = [
      gameWith(1, fullScores()),
      gameWith(2, { ONES: 2 }),
    ];
    const hit = detectSheetFuseHighlight(before, after);
    assert.ok(hit);
    assert.deepEqual(hit!.rows, ["ONES"]);
    assert.deepEqual(hit!.columns, [1]);
  });

  it("kein Extra-Trigger nur weil der Zettel fertig ist", () => {
    const before = [
      gameWith(1, fullScores()),
      gameWith(2, fullScores("CHANCE")),
    ];
    const after = [
      gameWith(1, fullScores()),
      gameWith(2, fullScores()),
    ];
    const hit = detectSheetFuseHighlight(before, after);
    assert.ok(hit);
    assert.deepEqual(hit!.rows, []);
    assert.deepEqual(hit!.columns, [2]);
  });

  it("null wenn nichts neu voll", () => {
    const games = [gameWith(1, { ONES: 1 })];
    assert.equal(detectSheetFuseHighlight(games, games), null);
  });
});

describe("fieldShouldGoldFlash", () => {
  it("trifft Zeile und Spalte", () => {
    assert.equal(
      fieldShouldGoldFlash({ rows: ["ONES"], columns: [] }, "ONES", 1),
      true,
    );
    assert.equal(
      fieldShouldGoldFlash({ rows: [], columns: [2] }, "CHANCE", 2),
      true,
    );
    assert.equal(
      fieldShouldGoldFlash({ rows: ["TWOS"], columns: [] }, "ONES", 1),
      false,
    );
  });
});
