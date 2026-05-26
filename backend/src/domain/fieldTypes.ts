/** Reihenfolge der 13 Felder pro Spiel (klassischer Kniffel-Block). */
export const FIELD_TYPES_PER_GAME = [
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
] as const;

export type FieldTypeId = (typeof FIELD_TYPES_PER_GAME)[number];

export const RUN_STATUS = {
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
} as const;
