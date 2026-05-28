import { RUN_STATUS } from "../domain/fieldTypes.js";
import { prisma } from "../db/prisma.js";
import { publicPlayerIdFromStoredName } from "../domain/playerIdentity.js";

export type RoundPointsAward = {
  playerName: string;
  winPoints: number;
  bonusPoints: number;
};

/** Sieger: 1 Siegpunkt + Differenz zum Letztplatzierten als Bonus. Alle anderen: 0. */
export function computeRoundPoints(
  players: { name: string; totalScore: number; orderIndex: number }[],
): RoundPointsAward[] {
  if (players.length < 2) return [];

  const sorted = [...players].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.orderIndex - b.orderIndex;
  });

  const winner = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const bonusPoints = Math.max(0, winner.totalScore - last.totalScore);

  return players.map((player) => {
    const isWinner =
      player.name === winner.name &&
      player.totalScore === winner.totalScore &&
      player.orderIndex === winner.orderIndex;

    return {
      playerName: player.name,
      winPoints: isWinner ? 1 : 0,
      bonusPoints: isWinner ? bonusPoints : 0,
    };
  });
}

export async function getLeagueStandings(leagueId: string) {
  const rows = await prisma.leagueStanding.findMany({ where: { leagueId } });

  const merged = new Map<string, { winPoints: number; bonusPoints: number }>();
  for (const row of rows) {
    const playerId = publicPlayerIdFromStoredName(row.playerName);
    const prev = merged.get(playerId) ?? { winPoints: 0, bonusPoints: 0 };
    merged.set(playerId, {
      winPoints: prev.winPoints + row.winPoints,
      bonusPoints: prev.bonusPoints + row.bonusPoints,
    });
  }

  return [...merged.entries()]
    .map(([playerId, points]) => ({
      playerId,
      winPoints: points.winPoints,
      bonusPoints: points.bonusPoints,
      totalPoints: points.winPoints + points.bonusPoints,
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.winPoints !== a.winPoints) return b.winPoints - a.winPoints;
      return a.playerId.localeCompare(b.playerId, "de");
    })
    .map((row, index) => ({ rank: index + 1, ...row }));
}

/** Vergibt Ligapunkte einmalig, wenn alle Runs einer Session beendet sind. */
export async function awardSessionLeaguePoints(sessionId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        players: {
          orderBy: { orderIndex: "asc" },
          include: { run: { select: { status: true, totalScore: true } } },
        },
      },
    });

    if (!session || session.pointsAwarded) return;

    const allDone =
      session.players.length >= 2 &&
      session.players.every((p) => p.run.status === RUN_STATUS.FINISHED);

    if (!allDone) return;

    const awards = computeRoundPoints(
      session.players.map((p) => ({
        name: p.name,
        totalScore: p.run.totalScore,
        orderIndex: p.orderIndex,
      })),
    );

    for (const award of awards) {
      const existing = await tx.leagueStanding.findUnique({
        where: {
          leagueId_playerName: {
            leagueId: session.leagueId,
            playerName: award.playerName,
          },
        },
      });

      if (existing) {
        await tx.leagueStanding.update({
          where: { id: existing.id },
          data: {
            winPoints: existing.winPoints + award.winPoints,
            bonusPoints: existing.bonusPoints + award.bonusPoints,
          },
        });
      } else {
        await tx.leagueStanding.create({
          data: {
            leagueId: session.leagueId,
            playerName: award.playerName,
            winPoints: award.winPoints,
            bonusPoints: award.bonusPoints,
          },
        });
      }
    }

    await tx.gameSession.update({
      where: { id: session.id },
      data: { pointsAwarded: true, status: "FINISHED" },
    });
  });
}
