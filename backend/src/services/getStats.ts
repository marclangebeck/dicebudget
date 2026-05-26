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
  const finished = await prisma.run.findMany({
    where: { status: RUN_STATUS.FINISHED },
    select: {
      gameCount: true,
      totalScore: true,
      games: { select: { score: true } },
    },
    orderBy: { finishedAt: "desc" },
  });

  if (finished.length === 0) {
    return {
      finishedRuns: 0,
      bestTotalScore: null,
      bestGameScore: null,
      averageTotalScore: null,
      bestByGameCount: [],
    };
  }

  const totalScores = finished.map((r) => r.totalScore);
  const gameScores = finished.flatMap((r) => r.games.map((g) => g.score));

  const bestByMap = new Map<number, number>();
  for (const run of finished) {
    const prev = bestByMap.get(run.gameCount);
    if (prev === undefined || run.totalScore > prev) {
      bestByMap.set(run.gameCount, run.totalScore);
    }
  }

  const bestByGameCount = [...bestByMap.entries()]
    .map(([gameCount, bestTotalScore]) => ({ gameCount, bestTotalScore }))
    .sort((a, b) => a.gameCount - b.gameCount);

  const sum = totalScores.reduce((a, b) => a + b, 0);

  return {
    finishedRuns: finished.length,
    bestTotalScore: Math.max(...totalScores),
    bestGameScore: gameScores.length > 0 ? Math.max(...gameScores) : null,
    averageTotalScore: Math.round(sum / finished.length),
    bestByGameCount,
  };
}
