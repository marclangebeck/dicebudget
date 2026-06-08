export type FieldTypeId =
  | "ONES"
  | "TWOS"
  | "THREES"
  | "FOURS"
  | "FIVES"
  | "SIXES"
  | "THREE_OF_A_KIND"
  | "FOUR_OF_A_KIND"
  | "FULL_HOUSE"
  | "SMALL_STRAIGHT"
  | "LARGE_STRAIGHT"
  | "KNIFFEL"
  | "CHANCE";

export type RollDto = {
  id: string;
  rollNumber: number;
  diceValues: number[];
};

export type FieldDto = {
  id: string;
  fieldType: FieldTypeId;
  score: number | null;
  rollsUsed: number;
  /** Würfel-Augenzahl bei Alle Fünfe (50 Punkte), für Strichliste auf dem Zettel. */
  yatzyDieValue?: number | null;
  rolls: RollDto[];
};

export type GameSummaryDto = {
  upperSum: number;
  bonus: number | null;
  ergebnisOben: number | null;
  lowerSum: number;
  extraYatzyBonus: number;
  /** Augenzahlen der Zusatz-Alle-Fünfe-Klicks (+100) auf diesem Spielblock. */
  extraYatzyDieValues?: number[];
  gameTotal: number;
};

export type GameDto = {
  id: string;
  index: number;
  score: number;
  summary: GameSummaryDto;
  fields: FieldDto[];
};

export type RunDto = {
  id: string;
  gameCount: number;
  useStrategyRules: boolean;
  totalScore: number;
  totalRollsUsed: number;
  extraYatzyCount: number;
  rollsInPool: number;
  rollsRemaining: number | null;
  status: string;
  createdAt: string;
  finishedAt: string | null;
  lastScoredFieldId: string | null;
  games: GameDto[];
};
