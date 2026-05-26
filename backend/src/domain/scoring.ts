import type { FieldTypeId } from "./fieldTypes.js";

export type DiceValues = [number, number, number, number, number];

function assertDice(values: number[]): asserts values is DiceValues {
  if (values.length !== 5 || values.some((d) => !Number.isInteger(d) || d < 1 || d > 6)) {
    throw new Error("diceValues must be five integers between 1 and 6");
  }
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
  const counts = [...new Set(values.map((d) => countFace(values, d)))].sort((a, b) => a - b);
  return counts.length === 2 && counts[0] === 2 && counts[1] === 3;
}

function isSmallStraight(values: DiceValues): boolean {
  const set = new Set(values);
  const straights = ["1234", "2345", "3456"];
  return straights.some((s) => [...s].every((ch) => set.has(Number(ch))));
}

function isLargeStraight(values: DiceValues): boolean {
  const sorted = [...values].sort((a, b) => a - b).join("");
  return sorted === "12345" || sorted === "23456";
}

export function scoreField(fieldType: FieldTypeId, diceValues: number[]): number {
  assertDice(diceValues);
  const dice = diceValues;

  switch (fieldType) {
    case "ONES":
      return countFace(dice, 1) * 1;
    case "TWOS":
      return countFace(dice, 2) * 2;
    case "THREES":
      return countFace(dice, 3) * 3;
    case "FOURS":
      return countFace(dice, 4) * 4;
    case "FIVES":
      return countFace(dice, 5) * 5;
    case "SIXES":
      return countFace(dice, 6) * 6;
    case "THREE_OF_A_KIND":
      return hasNOfAKind(dice, 3) ? sumDice(dice) : 0;
    case "FOUR_OF_A_KIND":
      return hasNOfAKind(dice, 4) ? sumDice(dice) : 0;
    case "FULL_HOUSE":
      return isFullHouse(dice) ? 25 : 0;
    case "SMALL_STRAIGHT":
      return isSmallStraight(dice) ? 30 : 0;
    case "LARGE_STRAIGHT":
      return isLargeStraight(dice) ? 40 : 0;
    case "KNIFFEL":
      return hasNOfAKind(dice, 5) ? 50 : 0;
    case "CHANCE":
      return sumDice(dice);
    default:
      return 0;
  }
}
