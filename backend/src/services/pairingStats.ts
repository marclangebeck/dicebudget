import { prisma } from "../db/prisma.js";
import { loadAliasMap, resolvePlayerName } from "./playerNames.js";

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
  manualBaselineNote: string | null;
};

export type PairingDetailDto = PairingSummaryDto & {
  rounds: PairingRoundDto[];
};

type SessionPlayer = {
  name: string;
  totalScore: number;
  orderIndex: number;
};

type ManualBaseline = {
  extraWinsA: number;
  extraWinsB: number;
  extraBonusA: number;
  extraBonusB: number;
  note: string | null;
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
  manualBaselineNote: string | null;
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
    manualBaselineNote: null,
    rounds: [],
  };
}

function applyManualBaseline(acc: PairingAccumulator, baseline: ManualBaseline): void {
  acc.playerAWins += baseline.extraWinsA;
  acc.playerBWins += baseline.extraWinsB;
  acc.playerABonusPoints += baseline.extraBonusA;
  acc.playerBBonusPoints += baseline.extraBonusB;
  acc.manualBaselineNote = baseline.note;
}

async function loadManualBaselines(): Promise<Map<string, ManualBaseline>> {
  const rows = await prisma.pairingManualBaseline.findMany();
  return new Map(
    rows.map((row) => [
      row.pairingKey,
      {
        extraWinsA: row.extraWinsA,
        extraWinsB: row.extraWinsB,
        extraBonusA: row.extraBonusA,
        extraBonusB: row.extraBonusB,
        note: row.note,
      },
    ]),
  );
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
  const [sessions, aliasMap, manualBaselines] = await Promise.all([
    loadFinishedSessions(),
    loadAliasMap(),
    loadManualBaselines(),
  ]);

  const map = new Map<string, PairingAccumulator>();

  for (const session of sessions) {
    if (session.players.length < 2) continue;

    const players: SessionPlayer[] = session.players.map((p) => ({
      name: resolvePlayerName(p.name, aliasMap),
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

  for (const [key, baseline] of manualBaselines) {
    const names = parsePairingKey(key);
    if (!names) continue;

    let acc = map.get(key);
    if (!acc) {
      acc = emptyAccumulator(key, names[0], names[1]);
      map.set(key, acc);
    }
    applyManualBaseline(acc, baseline);
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
    manualBaselineNote: acc.manualBaselineNote,
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
