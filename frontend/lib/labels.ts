import type { FieldTypeId } from "./types";

export const FIELD_LABELS: Record<FieldTypeId, string> = {
  ONES: "1er",
  TWOS: "2er",
  THREES: "3er",
  FOURS: "4er",
  FIVES: "5er",
  SIXES: "6er",
  THREE_OF_A_KIND: "3er Pasch",
  FOUR_OF_A_KIND: "4er Pasch",
  FULL_HOUSE: "Full House",
  SMALL_STRAIGHT: "Kl. Straße",
  LARGE_STRAIGHT: "Gr. Straße",
  KNIFFEL: "Alle Fünfe",
  CHANCE: "Chance",
};

/** Anzeige-Zeilen im Zettel (Backend liefert weiterhin upperSum, bonus, ergebnisOben). */
export const SUMMARY_LABELS = {
  ergebnis1: "Ergebnis 1",
  lowerSum: "Ergebnis 2",
  gameTotal: "Ergebnis Spiel",
} as const;

export type SummaryRowKey = keyof typeof SUMMARY_LABELS;

export type SheetRow =
  | { kind: "field"; fieldType: FieldTypeId }
  | { kind: "summary"; key: SummaryRowKey; highlight?: boolean };

export const SHEET_ROWS: SheetRow[] = [
  { kind: "field", fieldType: "ONES" },
  { kind: "field", fieldType: "TWOS" },
  { kind: "field", fieldType: "THREES" },
  { kind: "field", fieldType: "FOURS" },
  { kind: "field", fieldType: "FIVES" },
  { kind: "field", fieldType: "SIXES" },
  { kind: "summary", key: "ergebnis1", highlight: true },
  { kind: "field", fieldType: "THREE_OF_A_KIND" },
  { kind: "field", fieldType: "FOUR_OF_A_KIND" },
  { kind: "field", fieldType: "FULL_HOUSE" },
  { kind: "field", fieldType: "SMALL_STRAIGHT" },
  { kind: "field", fieldType: "LARGE_STRAIGHT" },
  { kind: "field", fieldType: "KNIFFEL" },
  { kind: "field", fieldType: "CHANCE" },
  { kind: "summary", key: "lowerSum" },
  { kind: "summary", key: "gameTotal", highlight: true },
];

export const UPPER_FIELD_TYPES: FieldTypeId[] = [
  "ONES",
  "TWOS",
  "THREES",
  "FOURS",
  "FIVES",
  "SIXES",
];

const DICE_VALUE_BY_FIELD: Partial<Record<FieldTypeId, 1 | 2 | 3 | 4 | 5 | 6>> = {
  ONES: 1,
  TWOS: 2,
  THREES: 3,
  FOURS: 4,
  FIVES: 5,
  SIXES: 6,
};

export function diceValueForField(fieldType: FieldTypeId): 1 | 2 | 3 | 4 | 5 | 6 | null {
  return DICE_VALUE_BY_FIELD[fieldType] ?? null;
}

/** Anzahl Würfel einer Augenzahl für einen gültigen oberen Eintrag. */
export function upperFieldDieCount(fieldType: FieldTypeId, score: number): number {
  const face = diceValueForField(fieldType);
  if (face === null || score === 0) return 0;
  return score / face;
}

export const LOWER_FIELD_TYPES: FieldTypeId[] = [
  "THREE_OF_A_KIND",
  "FOUR_OF_A_KIND",
  "FULL_HOUSE",
  "SMALL_STRAIGHT",
  "LARGE_STRAIGHT",
  "KNIFFEL",
  "CHANCE",
];

/** Obere Sektion: nur erreichbare Vielfache (null bis fünf Treffer der Augenzahl). */
const UPPER_FIELD_SCORE_CHOICES: Record<
  "ONES" | "TWOS" | "THREES" | "FOURS" | "FIVES" | "SIXES",
  readonly number[]
> = {
  ONES: [0, 1, 2, 3, 4, 5],
  TWOS: [0, 2, 4, 6, 8, 10],
  THREES: [0, 3, 6, 9, 12, 15],
  FOURS: [0, 4, 8, 12, 16, 20],
  FIVES: [0, 5, 10, 15, 20, 25],
  SIXES: [0, 6, 12, 18, 24, 30],
};

/** Kombinationen: Regelpunkte oder streichen mit 0. */
const FIXED_COMBO_SCORE_CHOICES = {
  FULL_HOUSE: [25, 0],
  SMALL_STRAIGHT: [30, 0],
  LARGE_STRAIGHT: [40, 0],
  KNIFFEL: [50, 0],
} as const satisfies Partial<Record<FieldTypeId, readonly number[]>>;

/** Dreier-/Viererpasch & Chance: jede Würfelsumme 5–30 plus 0. */
const SUM_DICE_SCORE_CHOICES: readonly number[] = Array.from(
  { length: 31 },
  (_, i) => i,
);

/**
 * Erlaubte Punktwerte fürs Eintrags-Panel (Buttons, keine Tastatur).
 * Logik parallel zu `backend/src/domain/fieldScores.ts`.
 */
export function fieldScoreChoices(fieldType: FieldTypeId): readonly number[] {
  if (fieldType in UPPER_FIELD_SCORE_CHOICES) {
    return UPPER_FIELD_SCORE_CHOICES[
      fieldType as keyof typeof UPPER_FIELD_SCORE_CHOICES
    ];
  }
  const combo = FIXED_COMBO_SCORE_CHOICES[fieldType as keyof typeof FIXED_COMBO_SCORE_CHOICES];
  if (combo) return combo;
  if (
    fieldType === "THREE_OF_A_KIND" ||
    fieldType === "FOUR_OF_A_KIND" ||
    fieldType === "CHANCE"
  ) {
    return SUM_DICE_SCORE_CHOICES;
  }
  throw new Error(`No score choices for field: ${String(fieldType)}`);
}
