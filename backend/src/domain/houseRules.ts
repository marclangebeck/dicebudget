import type { FieldTypeId } from "./fieldTypes.js";
import { FIELD_TYPES_PER_GAME } from "./fieldTypes.js";

export const BURN_POOL_COST = 5;

const UPPER_FACE: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
  ONES: 1,
  TWOS: 2,
  THREES: 3,
  FOURS: 4,
  FIVES: 5,
  SIXES: 6,
};

/** Erlaubte Scores beim Verkaufs-Freifeld (ohne Würfeln). */
export function rollSaleAllowedScores(fieldType: FieldTypeId): readonly number[] {
  const face = UPPER_FACE[fieldType];
  if (face !== undefined) {
    return [face * 4];
  }
  switch (fieldType) {
    case "THREE_OF_A_KIND":
    case "FOUR_OF_A_KIND":
      return [30];
    case "FULL_HOUSE":
      return [25];
    case "SMALL_STRAIGHT":
      return [30];
    default:
      return [];
  }
}

export function isRollSaleFieldAllowed(fieldType: FieldTypeId): boolean {
  return rollSaleAllowedScores(fieldType).length > 0;
}

export function isValidRollSaleScore(fieldType: FieldTypeId, score: number): boolean {
  return rollSaleAllowedScores(fieldType).includes(score);
}

type ScoredFieldRow = {
  fieldType: string;
  score: number | null;
};

type GameRow = {
  fields: ScoredFieldRow[];
};

/** Alle Spalten einer Feldzeile (z. B. alle Gr. Straßen) sind eingetragen. */
export function isFieldTypeRowFull(games: GameRow[], fieldType: FieldTypeId): boolean {
  if (games.length === 0) return false;
  for (const game of games) {
    const field = game.fields.find((f) => f.fieldType === fieldType);
    if (!field || field.score === null) return false;
  }
  return true;
}

export function listFullFieldTypeRows(games: GameRow[]): FieldTypeId[] {
  return FIELD_TYPES_PER_GAME.filter((fieldType) => isFieldTypeRowFull(games, fieldType));
}

export function hasAnyFullFieldTypeRow(games: GameRow[]): boolean {
  return listFullFieldTypeRows(games).length > 0;
}

type ScoredHistoryField = {
  fieldType: string;
  rollsUsed: number;
  scoredSequence: number | null;
  score: number | null;
};

/** Letzte zwei Einträge sind Alle Fünfe mit ≤ 3 Würfen. */
export function qualifiesYatzyStreakPenalty(fields: ScoredHistoryField[]): boolean {
  const scored = fields
    .filter((f) => f.score !== null && f.scoredSequence !== null)
    .sort((a, b) => (a.scoredSequence ?? 0) - (b.scoredSequence ?? 0));
  if (scored.length < 2) return false;
  const lastTwo = scored.slice(-2);
  return lastTwo.every(
    (f) => f.fieldType === "KNIFFEL" && f.rollsUsed >= 1 && f.rollsUsed <= 3,
  );
}

export function halvePoolRoundedDown(pool: number): number {
  return Math.floor(pool / 2);
}
