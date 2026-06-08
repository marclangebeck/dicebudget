import {
  FIELD_TYPES_PER_GAME,
  type FieldTypeId,
} from "./fieldTypes.js";

export const UPPER_FIELD_TYPES = FIELD_TYPES_PER_GAME.slice(0, 6);
export const LOWER_FIELD_TYPES = FIELD_TYPES_PER_GAME.slice(6);

export const UPPER_BONUS_MIN = 63;
export const UPPER_BONUS_POINTS = 35;
/** Ab dem 7. Yatzy je Klick +100 auf Ergebnis Spiel (rotierend Sp1…Spn). */
export const EXTRA_YATZY_BONUS_POINTS = 100;

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
  extraYatzyDieValues?: number[];
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
  const upperFields = fields.filter((f) =>
    UPPER_FIELD_TYPES.includes(f.fieldType as FieldTypeId),
  );
  const lowerFields = fields.filter((f) =>
    LOWER_FIELD_TYPES.includes(f.fieldType as FieldTypeId),
  );

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

/** Nächste Spielspalte für einen Zusatz-Yatzy-Bonus (1-basiert, rotierend). */
export function gameIndexForExtraYatzyClick(
  extraYatzyCountAfterClick: number,
  gameCount: number,
): number {
  if (gameCount < 1 || extraYatzyCountAfterClick < 1) {
    throw new Error("invalid extra yatzy assignment");
  }
  return ((extraYatzyCountAfterClick - 1) % gameCount) + 1;
}
