import type { FieldTypeId, RunDto } from "@/lib/types";

export const BURN_POOL_COST = 2;

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

export function qualifiesYatzyStreakPenalty(fields: ScoredHistoryField[]): boolean {
  const scored = fields
    .filter((f) => f.score !== null && f.scoredSequence != null)
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
