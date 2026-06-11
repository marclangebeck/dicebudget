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
  /** Vorzeitig beendet (offene Felder); Session-Flow wie FINISHED, nicht in /stats. */
  ABANDONED: "ABANDONED",
} as const;

export type RunStatusId = (typeof RUN_STATUS)[keyof typeof RUN_STATUS];

const fieldOrder = new Map<string, number>(
  FIELD_TYPES_PER_GAME.map((type, index) => [type, index]),
);

export function sortFields<T extends { fieldType: string }>(fields: T[]): T[] {
  return [...fields].sort(
    (a, b) =>
      (fieldOrder.get(a.fieldType) ?? 0) - (fieldOrder.get(b.fieldType) ?? 0),
  );
}

export function isRunTerminal(status: string): boolean {
  return status === RUN_STATUS.FINISHED || status === RUN_STATUS.ABANDONED;
}
