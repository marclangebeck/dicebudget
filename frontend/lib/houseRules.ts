import type { FieldTypeId, RunDto } from "@/lib/types";

export const BURN_POOL_COST = 1;

/** Brennt: leeres Feld gewählt, Eintrag noch nicht gebucht (nicht Korrektur). */
export function canBurnHouseRule(
  run: RunDto,
  activeFieldId: string | null,
  isCorrection: boolean,
): boolean {
  if (!activeFieldId || run.status !== "ACTIVE" || !run.useStrategyRules) return false;
  if (isCorrection) return false;
  if (run.rollsInPool < BURN_POOL_COST) return false;
  const field = run.games.flatMap((g) => g.fields).find((f) => f.id === activeFieldId);
  if (!field || field.score !== null) return false;
  return field.rollsUsed === 0;
}

const UPPER_FACE: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
  ONES: 1,
  TWOS: 2,
  THREES: 3,
  FOURS: 4,
  FIVES: 5,
  SIXES: 6,
};

const FIELD_TYPES: FieldTypeId[] = [
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
  fieldType: FieldTypeId;
  score: number | null;
};

type GameRow = {
  fields: ScoredFieldRow[];
};

export function isFieldTypeRowFull(games: GameRow[], fieldType: FieldTypeId): boolean {
  if (games.length === 0) return false;
  for (const game of games) {
    const field = game.fields.find((f) => f.fieldType === fieldType);
    if (!field || field.score === null) return false;
  }
  return true;
}

export function listFullFieldTypeRows(games: GameRow[]): FieldTypeId[] {
  return FIELD_TYPES.filter((fieldType) => isFieldTypeRowFull(games, fieldType));
}

export function hasAnyFullFieldTypeRow(games: GameRow[]): boolean {
  return listFullFieldTypeRows(games).length > 0;
}

type ScoredHistoryField = {
  fieldType: FieldTypeId;
  rollsUsed: number;
  scoredSequence?: number | null;
  score: number | null;
};

function scoredHistory(fields: ScoredHistoryField[]): ScoredHistoryField[] {
  return fields
    .filter((f) => f.score !== null && f.scoredSequence != null)
    .sort((a, b) => (a.scoredSequence ?? 0) - (b.scoredSequence ?? 0));
}

function isFastYatzy(field: ScoredHistoryField): boolean {
  return field.fieldType === "KNIFFEL" && field.rollsUsed >= 1 && field.rollsUsed <= 3;
}

export function qualifiesYatzyStreakPenalty(fields: ScoredHistoryField[]): boolean {
  const scored = scoredHistory(fields);
  if (scored.length < 2) return false;
  return scored.slice(-2).every(isFastYatzy);
}

export function qualifiesYatzyTriplePenalty(fields: ScoredHistoryField[]): boolean {
  const scored = scoredHistory(fields);
  if (scored.length < 3) return false;
  return scored.slice(-3).every(isFastYatzy);
}

export function halvePoolRoundedDown(pool: number): number {
  return Math.floor(pool / 2);
}

const UPPER_FIELD_TYPE_SET = new Set<FieldTypeId>([
  "ONES",
  "TWOS",
  "THREES",
  "FOURS",
  "FIVES",
  "SIXES",
]);

/** Offene Felder im oberen Bereich über alle Spiele. */
export function countOpenUpperFields(games: GameRow[]): number {
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

export function isRunUpperComplete(games: GameRow[]): boolean {
  return countOpenUpperFields(games) === 0;
}

export function yatzyStreakPenaltyMarker(fields: ScoredHistoryField[]): number | null {
  if (!qualifiesYatzyStreakPenalty(fields)) return null;
  const lastTwo = scoredHistory(fields).slice(-2);
  return Math.max(lastTwo[0]!.scoredSequence ?? 0, lastTwo[1]!.scoredSequence ?? 0);
}

export function yatzyTriplePenaltyMarker(fields: ScoredHistoryField[]): number | null {
  if (!qualifiesYatzyTriplePenalty(fields)) return null;
  const lastThree = scoredHistory(fields).slice(-3);
  return Math.max(
    lastThree[0]!.scoredSequence ?? 0,
    lastThree[1]!.scoredSequence ?? 0,
    lastThree[2]!.scoredSequence ?? 0,
  );
}
