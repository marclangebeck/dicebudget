import { RUN_STATUS } from "../domain/fieldTypes.js";
import { prisma } from "../db/prisma.js";

export type StatsDto = {
  finishedRuns: number;
  bestTotalScore: number | null;
  bestGameScore: number | null;
  averageTotalScore: number | null;
  bestByGameCount: { gameCount: number; bestTotalScore: number }[];
};

export async function getStats(): Promise<StatsDto> {
  const finishedWhere = { status: RUN_STATUS.FINISHED };

  const [runAgg, bestGameAgg, bestByGameCountRaw] = await Promise.all([
    prisma.run.aggregate({
      where: finishedWhere,
      _count: { _all: true },
      _max: { totalScore: true },
      _avg: { totalScore: true },
    }),
    prisma.game.aggregate({
      where: { run: finishedWhere },
      _max: { score: true },
    }),
    prisma.run.groupBy({
      by: ["gameCount"],
      where: finishedWhere,
      _max: { totalScore: true },
      orderBy: { gameCount: "asc" },
    }),
  ]);

  const finishedRuns = runAgg._count._all;
  if (finishedRuns === 0) {
    return {
      finishedRuns: 0,
      bestTotalScore: null,
      bestGameScore: null,
      averageTotalScore: null,
      bestByGameCount: [],
    };
  }

  const bestByGameCount = bestByGameCountRaw
    .filter((row) => row._max.totalScore !== null)
    .map((row) => ({
      gameCount: row.gameCount,
      bestTotalScore: row._max.totalScore!,
    }));

  return {
    finishedRuns,
    bestTotalScore: runAgg._max.totalScore,
    bestGameScore: bestGameAgg._max.score,
    averageTotalScore:
      runAgg._avg.totalScore !== null ? Math.round(runAgg._avg.totalScore) : null,
    bestByGameCount,
  };
}
