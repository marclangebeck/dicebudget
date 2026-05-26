export type StatsDto = {
  finishedRuns: number;
  bestTotalScore: number | null;
  bestGameScore: number | null;
  averageTotalScore: number | null;
  bestByGameCount: { gameCount: number; bestTotalScore: number }[];
};
