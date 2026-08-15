import type { FieldTypeId } from "./fieldTypes.js";
import { FIELD_TYPES_PER_GAME } from "./fieldTypes.js";
import {
  LOWER_FIELD_TYPES,
  UPPER_BONUS_POINTS,
  computeGameBreakdown,
} from "./gameScoring.js";

export const BURN_POOL_COST = 1;
/** Brennt: brennenden Würfel neu würfeln, Rest liegen lassen. */
export const BURN_POOL_COST_REROLL = 1;
/** Brennt: Würfel daneben legen und Augenzahl selbst wählen. */
export const BURN_POOL_COST_SET_FACE = 2;

export type BurnMode = "reroll" | "set_face";

export function isBurnMode(value: unknown): value is BurnMode {
  return value === "reroll" || value === "set_face";
}

export function burnPoolCost(mode: BurnMode): number {
  return mode === "set_face" ? BURN_POOL_COST_SET_FACE : BURN_POOL_COST_REROLL;
}

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
  return (
    field.fieldType === "KNIFFEL" &&
    field.score === 50 &&
    field.rollsUsed >= 1 &&
    field.rollsUsed <= 3
  );
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

/**
 * Pool-Abzug von 1/n der Spielerzahl: Rest = floor(pool × (n−1) / n).
 * Bei n=2 identisch zum bisherigen Halbieren (floor(pool/2) bleibt).
 */
export function poolAfterPlayerShareLoss(
  pool: number,
  playerCount: number,
): { newPool: number; poolsLost: number } {
  const safePool = Number.isFinite(pool) ? Math.max(0, Math.floor(pool)) : 0;
  if (!Number.isInteger(playerCount) || playerCount < 2 || safePool <= 0) {
    return { newPool: safePool, poolsLost: 0 };
  }
  const newPool = Math.floor((safePool * (playerCount - 1)) / playerCount);
  return { newPool, poolsLost: safePool - newPool };
}

/** Gesamter Pool weg (3× Alle Fünfe). */
export function poolAfterFullLoss(pool: number): { newPool: number; poolsLost: number } {
  const safePool = Number.isFinite(pool) ? Math.max(0, Math.floor(pool)) : 0;
  return { newPool: 0, poolsLost: safePool };
}

export function halvePoolRoundedDown(pool: number): number {
  return poolAfterPlayerShareLoss(pool, 2).newPool;
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

// --- M40: Spalten-Pool-Boni (+2 / +2 / +2, max. 6, nur Erster in der Session) ---

export const COLUMN_POOL_BONUS = 2;

type ColumnFieldRow = {
  fieldType: string;
  score: number | null;
};

type ColumnGameRow = {
  fields: ColumnFieldRow[];
};

/** Eine Spalte: alle 1–6 voll und oberer Bonus (+35). */
export function gameColumnHasUpperBonus(fields: ColumnFieldRow[]): boolean {
  return computeGameBreakdown(fields).bonus === UPPER_BONUS_POINTS;
}

/** Eine Spalte: alle 7 unteren Felder eingetragen. */
export function gameColumnHasLowerComplete(fields: ColumnFieldRow[]): boolean {
  for (const fieldType of LOWER_FIELD_TYPES) {
    const field = fields.find((f) => f.fieldType === fieldType);
    if (!field || field.score === null) return false;
  }
  return true;
}

/** Dieselbe Spalte: oberer Bonus und unterer Bereich voll. */
export function gameColumnHasFullCombo(fields: ColumnFieldRow[]): boolean {
  return gameColumnHasUpperBonus(fields) && gameColumnHasLowerComplete(fields);
}

export function runHasAnyColumnUpperBonus(games: ColumnGameRow[]): boolean {
  return games.some((game) => gameColumnHasUpperBonus(game.fields));
}

export function runHasAnyColumnLowerComplete(games: ColumnGameRow[]): boolean {
  return games.some((game) => gameColumnHasLowerComplete(game.fields));
}

export function runHasAnyColumnFullCombo(games: ColumnGameRow[]): boolean {
  return games.some((game) => gameColumnHasFullCombo(game.fields));
}

/** True, wenn der Run den Zustand neu erreicht hat (vorher false, nachher true). */
export function newlyAchievedColumnGoal(
  beforeGames: ColumnGameRow[],
  afterGames: ColumnGameRow[],
  predicate: (games: ColumnGameRow[]) => boolean,
): boolean {
  return !predicate(beforeGames) && predicate(afterGames);
}
