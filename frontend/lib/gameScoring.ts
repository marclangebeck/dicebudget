import type { FieldTypeId } from "@/lib/types";

export const UPPER_FIELD_TYPES: FieldTypeId[] = [
  "ONES",
  "TWOS",
  "THREES",
  "FOURS",
  "FIVES",
  "SIXES",
];

export const LOWER_FIELD_TYPES: FieldTypeId[] = [
  "THREE_OF_A_KIND",
  "FOUR_OF_A_KIND",
  "FULL_HOUSE",
  "SMALL_STRAIGHT",
  "LARGE_STRAIGHT",
  "KNIFFEL",
  "CHANCE",
];

export const UPPER_BONUS_MIN = 63;
export const UPPER_BONUS_POINTS = 35;

type ScoredField = {
  fieldType: string;
  score: number | null;
};

export type GameBreakdown = {
  upperSum: number;
  bonus: number | null;
  ergebnisOben: number | null;
  lowerSum: number;
  extraYatzyBonus: number;
  gameTotal: number;
};

function sumScored(fields: ScoredField[]): number {
  return fields
    .filter((f) => f.score !== null)
    .reduce((sum, f) => sum + (f.score ?? 0), 0);
}

export function computeGameBreakdown(
  fields: ScoredField[],
  extraYatzyBonus = 0,
): GameBreakdown {
  const upperFields = fields.filter((f) => UPPER_FIELD_TYPES.includes(f.fieldType as FieldTypeId));
  const lowerFields = fields.filter((f) => LOWER_FIELD_TYPES.includes(f.fieldType as FieldTypeId));

  const upperScoredCount = upperFields.filter((f) => f.score !== null).length;
  const upperComplete = upperScoredCount === UPPER_FIELD_TYPES.length;

  const upperSum = sumScored(upperFields);
  const lowerSum = sumScored(lowerFields);

  const bonus = upperComplete
    ? upperSum >= UPPER_BONUS_MIN
      ? UPPER_BONUS_POINTS
      : 0
    : null;

  const ergebnisOben = upperComplete ? upperSum + (bonus ?? 0) : null;
  const safeExtra = Math.max(0, extraYatzyBonus);
  const gameTotal = (ergebnisOben ?? upperSum) + lowerSum + safeExtra;

  return {
    upperSum,
    bonus,
    ergebnisOben,
    lowerSum,
    extraYatzyBonus: safeExtra,
    gameTotal,
  };
}

/** Augenzahl je oberem Feld (für die maximal erreichbare Restpunktzahl). */
const UPPER_FIELD_FACE: Record<string, number> = {
  ONES: 1,
  TWOS: 2,
  THREES: 3,
  FOURS: 4,
  FIVES: 5,
  SIXES: 6,
};

/**
 * Live-Delta zum oberen Bonus relativ zur Soll-Marke „3 je Augenzahl“.
 * Summiert über die bereits eingetragenen oberen Felder:
 *   delta = obere Summe − 3 × (Summe der Augenzahlen der eingetragenen Felder)
 * Positiv = über dem Schnitt, negativ = darunter, 0 = genau auf Kurs.
 * Sind alle 6 Felder gefüllt, gilt: delta ≥ 0 ⇔ Bonus erreicht.
 */
export function upperBonusDelta(fields: ScoredField[]): number {
  const scoredUpper = fields.filter(
    (f) => UPPER_FIELD_TYPES.includes(f.fieldType as FieldTypeId) && f.score !== null,
  );
  const upperSum = scoredUpper.reduce((sum, f) => sum + (f.score ?? 0), 0);
  const facesSum = scoredUpper.reduce(
    (sum, f) => sum + (UPPER_FIELD_FACE[f.fieldType] ?? 0),
    0,
  );
  return upperSum - 3 * facesSum;
}

/**
 * True, wenn die obere Sektion vollständig eingetragen ist (alle 6 Felder)
 * und den Bonus erreicht (Summe ≥ 63). Basis für die Bonus-Einblendung (M31).
 */
export function upperBonusAchieved(fields: ScoredField[]): boolean {
  const upperFields = fields.filter((f) =>
    UPPER_FIELD_TYPES.includes(f.fieldType as FieldTypeId),
  );
  const allScored =
    upperFields.length === UPPER_FIELD_TYPES.length &&
    upperFields.every((f) => f.score !== null);
  if (!allScored) return false;
  return sumScored(upperFields) >= UPPER_BONUS_MIN;
}

export function gameIndexForExtraYatzyClick(
  extraYatzyCountAfterClick: number,
  gameCount: number,
): number {
  if (gameCount < 1 || extraYatzyCountAfterClick < 1) {
    throw new Error("invalid extra yatzy assignment");
  }
  return ((extraYatzyCountAfterClick - 1) % gameCount) + 1;
}

