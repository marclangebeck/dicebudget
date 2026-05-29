import type { FieldTypeId } from "@/lib/types";

export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export type DiceValues = [DieValue, DieValue, DieValue, DieValue, DieValue];
/** Anzahl pro Augenzahl: Index 0 = Einer, … Index 5 = Sechser. */
export type DieCounts = [number, number, number, number, number, number];

export type FieldPreviewTier = "option" | "zero";

export type FieldPreview = {
  score: number;
  tier: FieldPreviewTier;
  /** Yatzy / Straßen: 0 oder Festwert — Wurf egal. */
  fixedChoice?: boolean;
};

export const DEFAULT_DICE: DiceValues = [1, 1, 1, 1, 1];
export const DEFAULT_DIE_COUNTS: DieCounts = [5, 0, 0, 0, 0, 0];

export const FIXED_RULE_FIELDS = {
  KNIFFEL: 50,
  SMALL_STRAIGHT: 30,
  LARGE_STRAIGHT: 40,
} as const satisfies Partial<Record<FieldTypeId, number>>;

export function isFixedRuleField(fieldType: FieldTypeId): boolean {
  return fieldType in FIXED_RULE_FIELDS;
}

export function fixedRuleScore(fieldType: FieldTypeId): number | null {
  if (!isFixedRuleField(fieldType)) return null;
  return FIXED_RULE_FIELDS[fieldType as keyof typeof FIXED_RULE_FIELDS];
}

export function dieCountsTotal(counts: DieCounts): number {
  return counts.reduce((sum, n) => sum + n, 0);
}

export function dieCountsToDiceValues(counts: DieCounts): DiceValues | null {
  if (dieCountsTotal(counts) !== 5) return null;
  return dieCountsToPartialDice(counts) as DiceValues;
}

export function dieCountsToPartialDice(counts: DieCounts): DieValue[] {
  const values: number[] = [];
  for (let face = 0; face < 6; face++) {
    for (let i = 0; i < counts[face]; i++) {
      values.push(face + 1);
    }
  }
  values.sort((a, b) => a - b);
  return values as DieValue[];
}

export function diceValuesToDieCounts(values: DiceValues): DieCounts {
  const counts: DieCounts = [0, 0, 0, 0, 0, 0];
  for (const value of values) {
    counts[value - 1] += 1;
  }
  return counts;
}

function sumDice(values: DiceValues): number {
  return values.reduce((a, b) => a + b, 0);
}

function countFace(values: DiceValues, face: number): number {
  return values.filter((d) => d === face).length;
}

function hasNOfAKind(values: DiceValues, n: number): boolean {
  const counts = new Map<number, number>();
  for (const d of values) {
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return [...counts.values()].some((c) => c >= n);
}

function isFullHouse(values: DiceValues): boolean {
  const counts = [...new Set(values.map((d) => countFace(values, d)))].sort(
    (a, b) => a - b,
  );
  return counts.length === 2 && counts[0] === 2 && counts[1] === 3;
}

function isSmallStraight(values: DiceValues): boolean {
  const set = new Set<number>(values);
  const straights = ["1234", "2345", "3456"];
  return straights.some((s) => [...s].every((ch) => set.has(Number(ch))));
}

function isLargeStraight(values: DiceValues): boolean {
  const sorted = [...values].sort((a, b) => a - b).join("");
  return sorted === "12345" || sorted === "23456";
}

/** Punkte für ein Feld aus fünf Würfeln — parallel zu `backend/src/domain/scoring.ts`. */
export function scoreField(fieldType: FieldTypeId, diceValues: DiceValues): number {
  switch (fieldType) {
    case "ONES":
      return countFace(diceValues, 1) * 1;
    case "TWOS":
      return countFace(diceValues, 2) * 2;
    case "THREES":
      return countFace(diceValues, 3) * 3;
    case "FOURS":
      return countFace(diceValues, 4) * 4;
    case "FIVES":
      return countFace(diceValues, 5) * 5;
    case "SIXES":
      return countFace(diceValues, 6) * 6;
    case "THREE_OF_A_KIND":
      return hasNOfAKind(diceValues, 3) ? sumDice(diceValues) : 0;
    case "FOUR_OF_A_KIND":
      return hasNOfAKind(diceValues, 4) ? sumDice(diceValues) : 0;
    case "FULL_HOUSE":
      return isFullHouse(diceValues) ? 25 : 0;
    case "SMALL_STRAIGHT":
      return isSmallStraight(diceValues) ? 30 : 0;
    case "LARGE_STRAIGHT":
      return isLargeStraight(diceValues) ? 40 : 0;
    case "KNIFFEL":
      return hasNOfAKind(diceValues, 5) ? 50 : 0;
    case "CHANCE":
      return sumDice(diceValues);
    default:
      return 0;
  }
}

export function computeFieldPreviews(
  openFields: readonly { id: string; fieldType: FieldTypeId }[],
  diceValues: DiceValues,
): Map<string, FieldPreview> {
  const previews = new Map<string, FieldPreview>();

  for (const field of openFields) {
    const fixed = fixedRuleScore(field.fieldType);
    if (fixed !== null) {
      previews.set(field.id, {
        score: fixed,
        tier: "option",
        fixedChoice: true,
      });
      continue;
    }

    const score = scoreField(field.fieldType, diceValues);
    previews.set(field.id, {
      score,
      tier: score > 0 ? "option" : "zero",
    });
  }

  return previews;
}
