import type { FieldTypeId } from "./fieldTypes.js";
import { FIELD_TYPES_PER_GAME } from "./fieldTypes.js";

/** Erlaubte Scores pro Feldtyp — Logik parallel zu `frontend/lib/labels.ts` (`fieldScoreChoices`). */

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

const FIXED_COMBO_SCORE_CHOICES = {
  FULL_HOUSE: [25, 0],
  SMALL_STRAIGHT: [30, 0],
  LARGE_STRAIGHT: [40, 0],
  KNIFFEL: [50, 0],
} as const satisfies Partial<Record<FieldTypeId, readonly number[]>>;

const SUM_DICE_SCORE_CHOICES: readonly number[] = Array.from(
  { length: 31 },
  (_, i) => i,
);

const ALLOWED_BY_FIELD = new Map<FieldTypeId, ReadonlySet<number>>();

function buildAllowedSets(): void {
  for (const fieldType of FIELD_TYPES_PER_GAME) {
    ALLOWED_BY_FIELD.set(fieldType, new Set(fieldScoreChoices(fieldType)));
  }
}

export function fieldScoreChoices(fieldType: FieldTypeId): readonly number[] {
  if (fieldType in UPPER_FIELD_SCORE_CHOICES) {
    return UPPER_FIELD_SCORE_CHOICES[
      fieldType as keyof typeof UPPER_FIELD_SCORE_CHOICES
    ];
  }
  const combo =
    FIXED_COMBO_SCORE_CHOICES[fieldType as keyof typeof FIXED_COMBO_SCORE_CHOICES];
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

buildAllowedSets();

export function isKnownFieldType(fieldType: string): fieldType is FieldTypeId {
  return (FIELD_TYPES_PER_GAME as readonly string[]).includes(fieldType);
}

export function isValidScoreForField(fieldType: FieldTypeId, score: number): boolean {
  return ALLOWED_BY_FIELD.get(fieldType)?.has(score) ?? false;
}

export class InvalidFieldScoreError extends Error {
  constructor(fieldType: FieldTypeId, score: number) {
    super(`Score ${score} is not allowed for field type ${fieldType}`);
    this.name = "InvalidFieldScoreError";
  }
}

export function assertValidScoreForField(fieldType: string, score: number): void {
  if (!isKnownFieldType(fieldType)) {
    throw new Error(`Unknown field type: ${fieldType}`);
  }
  if (!isValidScoreForField(fieldType, score)) {
    throw new InvalidFieldScoreError(fieldType, score);
  }
}
