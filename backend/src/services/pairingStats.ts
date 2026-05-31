import { prisma } from "../db/prisma.js";
import { publicPlayerIdFromStoredName } from "../domain/playerIdentity.js";

export type PairingRoundDto = {
  inviteCode: string;
  leagueCode: string;
  roundNumber: number;
  finishedAt: string | null;
  playerAScore: number;
  playerBScore: number;
  winner: "A" | "B" | "tie";
  scoreDiff: number;
};

export type PairingSummaryDto = {
  key: string;
  playerA: string;
  playerB: string;
  roundsPlayed: number;
  appRoundsPlayed: number;
  playerAWins: number;
  playerBWins: number;
  playerAAppWins: number;
  playerBAppWins: number;
  ties: number;
  playerABonusPoints: number;
  playerBBonusPoints: number;
  playerATotalScore: number;
  playerBTotalScore: number;
  lastPlayedAt: string | null;
};

export type PairingDetailDto = PairingSummaryDto & {
  rounds: PairingRoundDto[];
};

type SessionPlayer = {
  name: string;
  totalScore: number;
  orderIndex: number;
};

export function pairingKey(nameA: string, nameB: string): string {
  const [playerA, playerB] = [nameA, nameB].sort((a, b) => a.localeCompare(b, "de"));
  return `${playerA}::${playerB}`;
}

export function parsePairingKey(key: string): [string, string] | null {
  const idx = key.indexOf("::");
  if (idx <= 0 || idx >= key.length - 2) return null;
  const playerA = key.slice(0, idx);
  const playerB = key.slice(idx + 2);
  if (!playerA || !playerB) return null;
  return [playerA, playerB];
}

function winnerSide(
  a: SessionPlayer,
  b: SessionPlayer,
): "A" | "B" | "tie" {
  if (a.totalScore > b.totalScore) return "A";
  if (b.totalScore > a.totalScore) return "B";
  if (a.orderIndex < b.orderIndex) return "A";
  if (b.orderIndex < a.orderIndex) return "B";
  return "tie";
}

type PairingAccumulator = {
  key: string;
  playerA: string;
  playerB: string;
  roundsPlayed: number;
  appRoundsPlayed: number;
  playerAWins: number;
  playerBWins: number;
  playerAAppWins: number;
  playerBAppWins: number;
  ties: number;
  playerABonusPoints: number;
  playerBBonusPoints: number;
  playerATotalScore: number;
  playerBTotalScore: number;
  lastPlayedAt: string | null;
  rounds: PairingRoundDto[];
};

function emptyAccumulator(key: string, playerA: string, playerB: string): PairingAccumulator {
  return {
    key,
    playerA,
    playerB,
    roundsPlayed: 0,
    appRoundsPlayed: 0,
    playerAWins: 0,
    playerBWins: 0,
    playerAAppWins: 0,
    playerBAppWins: 0,
    ties: 0,
    playerABonusPoints: 0,
    playerBBonusPoints: 0,
    playerATotalScore: 0,
    playerBTotalScore: 0,
    lastPlayedAt: null,
    rounds: [],
  };
}

async function loadFinishedSessions() {
  return prisma.gameSession.findMany({
    where: { pointsAwarded: true },
    include: {
      league: { select: { leagueCode: true } },
      players: {
        orderBy: { orderIndex: "asc" },
        include: { run: { select: { totalScore: true, finishedAt: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function accumulatePairings(): Promise<Map<string, PairingAccumulator>> {
  const sessions = await loadFinishedSessions();

  const map = new Map<string, PairingAccumulator>();

  for (const session of sessions) {
    if (session.players.length < 2) continue;

    const players: SessionPlayer[] = session.players.map((p) => ({
      name: publicPlayerIdFromStoredName(p.name),
      totalScore: p.run.totalScore,
      orderIndex: p.orderIndex,
    }));

    const finishedAt =
      session.players
        .map((p) => p.run.finishedAt)
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() ?? null;

    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const left = players[i]!;
        const right = players[j]!;
        if (left.name === right.name) continue;

        const key = pairingKey(left.name, right.name);
        const [playerA, playerB] = parsePairingKey(key)!;

        let acc = map.get(key);
        if (!acc) {
          acc = emptyAccumulator(key, playerA, playerB);
          map.set(key, acc);
        }

        const scoreA = left.name === playerA ? left.totalScore : right.totalScore;
        const scoreB = left.name === playerB ? left.totalScore : right.totalScore;
        const playerARef = left.name === playerA ? left : right;
        const playerBRef = left.name === playerB ? left : right;
        const side = winnerSide(playerARef, playerBRef);
        const scoreDiff = Math.abs(scoreA - scoreB);

        acc.roundsPlayed += 1;
        acc.appRoundsPlayed += 1;
        acc.playerATotalScore += scoreA;
        acc.playerBTotalScore += scoreB;
        if (side === "A") {
          acc.playerAWins += 1;
          acc.playerAAppWins += 1;
          acc.playerABonusPoints += scoreDiff;
        } else if (side === "B") {
          acc.playerBWins += 1;
          acc.playerBAppWins += 1;
          acc.playerBBonusPoints += scoreDiff;
        } else {
          acc.ties += 1;
        }

        if (finishedAt && (!acc.lastPlayedAt || finishedAt > acc.lastPlayedAt)) {
          acc.lastPlayedAt = finishedAt;
        }

        acc.rounds.push({
          inviteCode: session.inviteCode,
          leagueCode: session.league.leagueCode,
          roundNumber: session.roundNumber,
          finishedAt,
          playerAScore: scoreA,
          playerBScore: scoreB,
          winner: side,
          scoreDiff,
        });
      }
    }
  }

  return map;
}

function toSummary(acc: PairingAccumulator): PairingSummaryDto {
  return {
    key: acc.key,
    playerA: acc.playerA,
    playerB: acc.playerB,
    roundsPlayed: acc.roundsPlayed,
    appRoundsPlayed: acc.appRoundsPlayed,
    playerAWins: acc.playerAWins,
    playerBWins: acc.playerBWins,
    playerAAppWins: acc.playerAAppWins,
    playerBAppWins: acc.playerBAppWins,
    ties: acc.ties,
    playerABonusPoints: acc.playerABonusPoints,
    playerBBonusPoints: acc.playerBBonusPoints,
    playerATotalScore: acc.playerATotalScore,
    playerBTotalScore: acc.playerBTotalScore,
    lastPlayedAt: acc.lastPlayedAt,
  };
}

export async function listPairingSummaries(): Promise<PairingSummaryDto[]> {
  const map = await accumulatePairings();
  return [...map.values()]
    .map(toSummary)
    .sort((a, b) => {
      const totalWinsA = a.playerAWins + a.playerBWins;
      const totalWinsB = b.playerAWins + b.playerBWins;
      if (totalWinsB !== totalWinsA) return totalWinsB - totalWinsA;
      return a.playerA.localeCompare(b.playerA, "de");
    });
}

/** Normalisiert eingehende Pairing-Keys zu einem Set kanonischer Keys. */
export function normalizePairingKeys(keys: string[]): Set<string> {
  const set = new Set<string>();
  for (const k of keys) {
    const names = parsePairingKey(k);
    if (names) set.add(pairingKey(names[0], names[1]));
  }
  return set;
}

/**
 * Entscheidet, wie eine Session bzgl. der ausgewählten Paarungen behandelt wird:
 * - "delete": exakte 2-Spieler-Paarung, deren Key ausgewählt ist
 * - "skip-multi": Mehr-Spieler-Session, die ein ausgewähltes Paar enthält (nicht löschbar)
 * - "ignore": betrifft keine ausgewählte Paarung
 */
export function sessionResetAction(
  publicIds: string[],
  targetKeys: Set<string>,
): "delete" | "skip-multi" | "ignore" {
  const unique = [...new Set(publicIds)];
  if (unique.length === 2) {
    return targetKeys.has(pairingKey(unique[0]!, unique[1]!)) ? "delete" : "ignore";
  }
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      if (targetKeys.has(pairingKey(unique[i]!, unique[j]!))) return "skip-multi";
    }
  }
  return "ignore";
}

/**
 * Setzt ausgewählte Paarungen zurück: löscht die zugehörigen abgeschlossenen
 * 2-Spieler-Sessions (inkl. Runs/Games/Fields/Rolls). Mehr-Spieler-Sessions
 * werden zum Schutz anderer Paarungen nicht angetastet.
 */
export async function resetPairings(
  keys: string[],
): Promise<{ deletedSessions: number; skippedMultiPlayer: number }> {
  const targetKeys = normalizePairingKeys(keys);
  if (targetKeys.size === 0) return { deletedSessions: 0, skippedMultiPlayer: 0 };

  const sessions = await prisma.gameSession.findMany({
    where: { pointsAwarded: true },
    include: { players: { include: { run: { select: { id: true } } } } },
  });

  let deletedSessions = 0;
  let skippedMultiPlayer = 0;

  for (const session of sessions) {
    const publicIds = session.players.map((p) =>
      publicPlayerIdFromStoredName(p.name),
    );
    const action = sessionResetAction(publicIds, targetKeys);
    if (action === "skip-multi") {
      skippedMultiPlayer += 1;
      continue;
    }
    if (action !== "delete") continue;

    const runIds = session.players.map((p) => p.run.id);
    await prisma.$transaction(async (tx) => {
      await tx.gameSession.delete({ where: { id: session.id } });
      if (runIds.length > 0) {
        await tx.run.deleteMany({ where: { id: { in: runIds } } });
      }
    });
    deletedSessions += 1;
  }

  return { deletedSessions, skippedMultiPlayer };
}

export async function getPairingDetail(key: string): Promise<PairingDetailDto | null> {
  const names = parsePairingKey(key);
  if (!names) return null;

  const normalizedKey = pairingKey(names[0], names[1]);
  const map = await accumulatePairings();
  const acc = map.get(normalizedKey);
  if (!acc) return null;

  return {
    ...toSummary(acc),
    rounds: [...acc.rounds].sort((a, b) => {
      const aTime = a.finishedAt ?? "";
      const bTime = b.finishedAt ?? "";
      return bTime.localeCompare(aTime);
    }),
  };
}
