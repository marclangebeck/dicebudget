export type PlayerRunMetricsDto = {
  totalScore: number;
  gameCount: number;
  useStrategyRules: boolean;
  bonusCount: number;
  upperSumTotal: number;
  lowerSumTotal: number;
  extraYatzyTotal: number;
  rollsInPool: number;
  totalRollsUsed: number;
  poolSpared: number;
  poolSpent: number;
  poolRollPoints: number;
  poolRollCost: number;
  pointsPerPoolRoll: number | null;
  avgRollsPerField: number | null;
  fieldsWithSpareRolls: number;
  fieldsWithPoolCost: number;
  yatzyHits: number;
  yatzyMisses: number;
  yatzyDieValues: number[];
  zeroEntries: number;
  lowerComboHits: Record<string, number>;
  gameTotals: number[];
};

export type AttributionRowDto = {
  key: string;
  label: string;
  viewerValue: number;
  opponentValue: number;
  diff: number;
};

export type HeadToHeadAnalysisDto = {
  scoreDiff: number;
  winner: "viewer" | "opponent" | "tie";
  attribution: AttributionRowDto[];
  decisiveGameIndex: number | null;
  decisiveGameDiff: number;
  decisiveFieldType: string | null;
  decisiveFieldDiff: number;
  counterfactual: string | null;
};

export type MatchAnalysisDto = {
  mode: "solo" | "multi";
  ready: boolean;
  unavailableReason: string | null;
  viewer: PlayerRunMetricsDto;
  opponent: PlayerRunMetricsDto | null;
  headToHead: HeadToHeadAnalysisDto | null;
  insights: string[];
  allPlayers: PlayerRunMetricsDto[];
};

export type SessionMatchAnalysisDto = MatchAnalysisDto & {
  inviteCode: string;
  leagueCode: string;
  roundNumber: number;
  finishedAt: string | null;
  viewerPlayerId: string;
  opponentPlayerId: string | null;
  viewerName: string;
  opponentName: string | null;
};
