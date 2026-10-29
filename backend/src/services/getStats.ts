import { RUN_STATUS } from "../domain/fieldTypes.js";
import {
  isValidPlayerId,
  normalizePlayerId,
  playerTokenFromId,
} from "../domain/playerIdentity.js";
import { prisma } from "../db/prisma.js";

export type StatsDto = {
  finishedRuns: number;
  bestTotalScore: number | null;
  bestGameScore: number | null;
  averageTotalScore: number | null;
  bestByGameCount: { gameCount: number; bestTotalScore: number }[];
};

const EMPTY_STATS: StatsDto = {
  finishedRuns: 0,
  bestTotalScore: null,
  bestGameScore: null,
  averageTotalScore: null,
  bestByGameCount: [],
};

/**
 * Aggregierte Run-Stats.
 * Mit playerId: nur Runs dieses Geräts (Multi via Player.name = pid:…).
 * Ohne playerId: leer (fail-closed). Admin-Bypass liegt in der Route.
 */
export async function getStats(playerId?: string | null): Promise<StatsDto> {
  if (!playerId || !isValidPlayerId(playerId)) {
    return { ...EMPTY_STATS };
  }

  const token = playerTokenFromId(normalizePlayerId(playerId));
  const finishedWhere = {
    status: RUN_STATUS.FINISHED,
    player: { name: token },
  };

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
    return { ...EMPTY_STATS };
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

/** Ungefilterte Aggregates (nur Admin). */
export async function getStatsGlobal(): Promise<StatsDto> {
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
    return { ...EMPTY_STATS };
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
