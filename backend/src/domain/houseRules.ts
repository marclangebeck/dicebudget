import type { FieldTypeId } from "./fieldTypes.js";
import { FIELD_TYPES_PER_GAME } from "./fieldTypes.js";

export const BURN_POOL_COST = 1;

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

function scoredHistory(fields: ScoredHistoryField[]): ScoredHistoryField[] {
  return fields
    .filter((f) => f.score !== null && f.scoredSequence !== null)
    .sort((a, b) => (a.scoredSequence ?? 0) - (b.scoredSequence ?? 0));
}

function isFastYatzy(field: ScoredHistoryField): boolean {
  return field.fieldType === "KNIFFEL" && field.rollsUsed >= 1 && field.rollsUsed <= 3;
}

/** Letzte zwei Einträge sind Alle Fünfe mit ≤ 3 Würfen. */
export function qualifiesYatzyStreakPenalty(fields: ScoredHistoryField[]): boolean {
  const scored = scoredHistory(fields);
  if (scored.length < 2) return false;
  return scored.slice(-2).every(isFastYatzy);
}

/** Letzte drei Einträge sind Alle Fünfe mit ≤ 3 Würfen. */
export function qualifiesYatzyTriplePenalty(fields: ScoredHistoryField[]): boolean {
  const scored = scoredHistory(fields);
  if (scored.length < 3) return false;
  return scored.slice(-3).every(isFastYatzy);
}

export function halvePoolRoundedDown(pool: number): number {
  return Math.floor(pool / 2);
}

const UPPER_FIELD_TYPE_SET = new Set(["ONES", "TWOS", "THREES", "FOURS", "FIVES", "SIXES"]);

type UpperFieldRow = {
  fieldType: string;
  score: number | null;
};

type UpperGameRow = {
  fields: UpperFieldRow[];
};

/** Offene Felder im oberen Bereich über alle Spiele (z. B. 6 Spiele × 6 = 36). */
export function countOpenUpperFields(games: UpperGameRow[]): number {
  let open = 0;
  for (const game of games) {
    for (const field of game.fields) {
      if (UPPER_FIELD_TYPE_SET.has(field.fieldType) && field.score === null) {
        open += 1;
      }
    }
  }
  return open;
}

export function isRunUpperComplete(games: UpperGameRow[]): boolean {
  return countOpenUpperFields(games) === 0;
}

/** Höchste scoredSequence der letzten beiden Alle-Fünfe-Einträge, sonst null. */
export function yatzyStreakPenaltyMarker(fields: ScoredHistoryField[]): number | null {
  if (!qualifiesYatzyStreakPenalty(fields)) return null;
  const lastTwo = scoredHistory(fields).slice(-2);
  return Math.max(lastTwo[0]!.scoredSequence ?? 0, lastTwo[1]!.scoredSequence ?? 0);
}

/** Höchste scoredSequence der letzten drei Alle-Fünfe-Einträge, sonst null. */
export function yatzyTriplePenaltyMarker(fields: ScoredHistoryField[]): number | null {
  if (!qualifiesYatzyTriplePenalty(fields)) return null;
  const lastThree = scoredHistory(fields).slice(-3);
  return Math.max(
    lastThree[0]!.scoredSequence ?? 0,
    lastThree[1]!.scoredSequence ?? 0,
    lastThree[2]!.scoredSequence ?? 0,
  );
}
