import { prisma } from "../db/prisma.js";
import { publicPlayerIdFromStoredName } from "../domain/playerIdentity.js";
import { rebuildLeagueStandings } from "./leaguePoints.js";

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
  /** Manueller Anteil (außerhalb der App nachgetragen) der Differenz je Spieler. */
  playerAManualBonus: number;
  playerBManualBonus: number;
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

export type PairingAccumulator = {
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
  playerAManualBonus: number;
  playerBManualBonus: number;
  playerATotalScore: number;
  playerBTotalScore: number;
  lastPlayedAt: string | null;
  rounds: PairingRoundDto[];
};

export function emptyAccumulator(key: string, playerA: string, playerB: string): PairingAccumulator {
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
    playerAManualBonus: 0,
    playerBManualBonus: 0,
    playerATotalScore: 0,
    playerBTotalScore: 0,
    lastPlayedAt: null,
    rounds: [],
  };
}

async function loadFinishedSessions() {
  return prisma.gameSession.findMany({
    where: { pointsAwarded: true, includeInPairingStats: true },
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

async function loadManualBaselines() {
  return prisma.pairingManualBaseline.findMany();
}

export type ManualBaselineFoldInput = {
  pairingKey: string;
  extraWinsA: number;
  extraWinsB: number;
  extraBonusA: number;
  extraBonusB: number;
  isAbsolute?: boolean;
  /** App-Stand zum Korrekturzeitpunkt; null/undefined = Legacy (kein Fortschreiben). */
  appWinsASnap?: number | null;
  appWinsBSnap?: number | null;
  appBonusASnap?: number | null;
  appBonusBSnap?: number | null;
};

/**
 * Wendet eine absolute Baseline auf einen Akkumulator an.
 * Mit Snapshot: Zielstand zum Korrekturzeitpunkt + danach neue App-Partien.
 * Ohne Snapshot (Legacy): Siege soft-advance via max(absolut, app); Diff eingefroren.
 */
export function applyAbsoluteBaselineToAccumulator(
  acc: PairingAccumulator,
  absolute: {
    winsA: number;
    winsB: number;
    bonusA: number;
    bonusB: number;
  },
  snap: {
    winsA: number;
    winsB: number;
    bonusA: number;
    bonusB: number;
  } | null,
): void {
  const appWinsA = acc.playerAAppWins;
  const appWinsB = acc.playerBAppWins;
  const appBonusA = acc.playerABonusPoints;
  const appBonusB = acc.playerBBonusPoints;

  if (snap) {
    const deltaWinsA = appWinsA - snap.winsA;
    const deltaWinsB = appWinsB - snap.winsB;
    acc.playerAWins = Math.max(0, absolute.winsA + deltaWinsA);
    acc.playerBWins = Math.max(0, absolute.winsB + deltaWinsB);

    const absNet = absolute.bonusA - absolute.bonusB;
    const snapNet = snap.bonusA - snap.bonusB;
    const appNet = appBonusA - appBonusB;
    const displayNet = absNet + (appNet - snapNet);
    if (displayNet >= 0) {
      acc.playerABonusPoints = displayNet;
      acc.playerBBonusPoints = 0;
    } else {
      acc.playerABonusPoints = 0;
      acc.playerBBonusPoints = -displayNet;
    }
    acc.playerAManualBonus = absolute.bonusA;
    acc.playerBManualBonus = absolute.bonusB;
  } else {
    // Legacy absolute ohne Snapshot: nicht dauerhaft unter App fallen, Diff bleibt Zielstand.
    acc.playerAWins = Math.max(absolute.winsA, appWinsA);
    acc.playerBWins = Math.max(absolute.winsB, appWinsB);
    acc.playerABonusPoints = absolute.bonusA;
    acc.playerBBonusPoints = absolute.bonusB;
    acc.playerAManualBonus = absolute.bonusA;
    acc.playerBManualBonus = absolute.bonusB;
  }

  acc.roundsPlayed = acc.playerAWins + acc.playerBWins + acc.ties;
}

/**
 * Rechnet manuell nachgetragene Werte in die Gesamt-Statistik ein.
 * - Legacy (isAbsolute=false): extraWins werden zu App-Siegen addiert.
 * - Absolut (isAbsolute=true): extraWins = Ziel-Gesamtstand zum Korrekturzeitpunkt
 *   (geräteübergreifend stabil). Mit App-Snapshot werden spätere App-Partien
 *   auf Siege und Diff fortgeschrieben — ohne Alias-Additiv-Drift.
 */
export function foldManualBaselines(
  map: Map<string, PairingAccumulator>,
  baselines: ManualBaselineFoldInput[],
): void {
  for (const baseline of baselines) {
    const names = parsePairingKey(baseline.pairingKey);
    if (!names) continue;
    const key = pairingKey(names[0], names[1]);
    const [playerA, playerB] = parsePairingKey(key)!;

    let acc = map.get(key);
    if (!acc) {
      acc = emptyAccumulator(key, playerA, playerB);
      map.set(key, acc);
    }

    const winsA = Math.max(0, Math.trunc(baseline.extraWinsA));
    const winsB = Math.max(0, Math.trunc(baseline.extraWinsB));
    const bonusA = Math.max(0, Math.trunc(baseline.extraBonusA));
    const bonusB = Math.max(0, Math.trunc(baseline.extraBonusB));
    const absolute = Boolean(baseline.isAbsolute);

    if (absolute) {
      const hasSnap =
        baseline.appWinsASnap != null &&
        baseline.appWinsBSnap != null &&
        baseline.appBonusASnap != null &&
        baseline.appBonusBSnap != null;
      applyAbsoluteBaselineToAccumulator(
        acc,
        { winsA, winsB, bonusA, bonusB },
        hasSnap
          ? {
              winsA: Math.max(0, Math.trunc(baseline.appWinsASnap!)),
              winsB: Math.max(0, Math.trunc(baseline.appWinsBSnap!)),
              bonusA: Math.max(0, Math.trunc(baseline.appBonusASnap!)),
              bonusB: Math.max(0, Math.trunc(baseline.appBonusBSnap!)),
            }
          : null,
      );
    } else {
      acc.roundsPlayed += winsA + winsB;
      acc.playerAWins += winsA;
      acc.playerBWins += winsB;
      acc.playerABonusPoints += bonusA;
      acc.playerBBonusPoints += bonusB;
      acc.playerAManualBonus += bonusA;
      acc.playerBManualBonus += bonusB;
    }
  }
}

const PAIRING_CACHE_TTL_MS = 60_000;

let pairingCache: {
  map: Map<string, PairingAccumulator>;
  expiresAt: number;
} | null = null;

/** Cache leeren (reset/baseline oder Tests). */
export function invalidatePairingStatsCache(): void {
  pairingCache = null;
}

/** Nur für Tests: Cache-Zustand prüfen. */
export function pairingStatsCacheStateForTests(): {
  active: boolean;
  expiresAt: number | null;
} {
  if (!pairingCache) return { active: false, expiresAt: null };
  return {
    active: Date.now() < pairingCache.expiresAt,
    expiresAt: pairingCache.expiresAt,
  };
}

/** Nur für Tests: Cache ohne DB befüllen. */
export function primePairingStatsCacheForTests(
  map: Map<string, PairingAccumulator>,
  expiresAt = Date.now() + PAIRING_CACHE_TTL_MS,
): void {
  pairingCache = { map, expiresAt };
}

async function getCachedAccumulatedPairings(): Promise<Map<string, PairingAccumulator>> {
  if (pairingCache && Date.now() < pairingCache.expiresAt) {
    return pairingCache.map;
  }
  const map = await accumulatePairings();
  pairingCache = { map, expiresAt: Date.now() + PAIRING_CACHE_TTL_MS };
  return map;
}

/** Nur App-Sessions (ohne manuelle Baselines) — für Absolut-Snapshots beim Speichern. */
async function accumulatePairingsFromSessionsOnly(): Promise<
  Map<string, PairingAccumulator>
> {
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

async function accumulatePairings(): Promise<Map<string, PairingAccumulator>> {
  const [map, baselines] = await Promise.all([
    accumulatePairingsFromSessionsOnly(),
    loadManualBaselines(),
  ]);

  foldManualBaselines(map, baselines);

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
    playerAManualBonus: acc.playerAManualBonus,
    playerBManualBonus: acc.playerBManualBonus,
    playerATotalScore: acc.playerATotalScore,
    playerBTotalScore: acc.playerBTotalScore,
    lastPlayedAt: acc.lastPlayedAt,
  };
}

export async function listPairingSummaries(): Promise<PairingSummaryDto[]> {
  const map = await getCachedAccumulatedPairings();
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
): Promise<{ deletedSessions: number; skippedMultiPlayer: number; leaguesRebuilt: number }> {
  const targetKeys = normalizePairingKeys(keys);
  if (targetKeys.size === 0) {
    return { deletedSessions: 0, skippedMultiPlayer: 0, leaguesRebuilt: 0 };
  }

  invalidatePairingStatsCache();

  // Manuell nachgetragene Werte der betroffenen Paarungen ebenfalls entfernen.
  await prisma.pairingManualBaseline.deleteMany({
    where: { pairingKey: { in: [...targetKeys] } },
  });

  const sessions = await prisma.gameSession.findMany({
    where: { pointsAwarded: true },
    include: { players: { include: { run: { select: { id: true } } } } },
  });

  let deletedSessions = 0;
  let skippedMultiPlayer = 0;
  const affectedLeagueIds = new Set<string>();

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

    affectedLeagueIds.add(session.leagueId);
    const runIds = session.players.map((p) => p.run.id);
    await prisma.$transaction(async (tx) => {
      await tx.gameSession.delete({ where: { id: session.id } });
      if (runIds.length > 0) {
        await tx.run.deleteMany({ where: { id: { in: runIds } } });
      }
    });
    deletedSessions += 1;
  }

  for (const leagueId of affectedLeagueIds) {
    await rebuildLeagueStandings(leagueId);
  }

  return { deletedSessions, skippedMultiPlayer, leaguesRebuilt: affectedLeagueIds.size };
}

export type PairingBaselineInput = {
  key: string;
  extraWinsA: number;
  extraWinsB: number;
  extraBonusA: number;
  extraBonusB: number;
  /** Absolut: extraWins = Ziel-Gesamtstand; sonst additiv (Legacy). */
  isAbsolute?: boolean;
  note?: string | null;
};

function clampInt(value: unknown): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * Schreibt manuell nachgetragene Werte für Paarungen.
 * Neue Admin-Korrekturen setzen isAbsolute=true (Zielstand für alle Geräte)
 * und speichern den aktuellen App-Stand als Snapshot zum Fortschreiben.
 */
export async function upsertPairingBaselines(
  inputs: PairingBaselineInput[],
): Promise<{ written: number; deleted: number }> {
  invalidatePairingStatsCache();

  const needsSnap = inputs.some((i) => Boolean(i.isAbsolute));
  const appMap = needsSnap ? await accumulatePairingsFromSessionsOnly() : null;

  let written = 0;
  let deleted = 0;

  for (const input of inputs) {
    const names = parsePairingKey(input.key);
    if (!names) continue;
    const key = pairingKey(names[0], names[1]);

    const extraWinsA = clampInt(input.extraWinsA);
    const extraWinsB = clampInt(input.extraWinsB);
    const extraBonusA = clampInt(input.extraBonusA);
    const extraBonusB = clampInt(input.extraBonusB);
    const isAbsolute = Boolean(input.isAbsolute);
    const note = typeof input.note === "string" && input.note.trim() ? input.note.trim() : null;

    const isEmpty =
      extraWinsA === 0 &&
      extraWinsB === 0 &&
      extraBonusA === 0 &&
      extraBonusB === 0 &&
      note === null;

    if (isEmpty) {
      const res = await prisma.pairingManualBaseline.deleteMany({
        where: { pairingKey: key },
      });
      deleted += res.count;
      continue;
    }

    const appAcc = appMap?.get(key);
    const appWinsASnap = isAbsolute ? (appAcc?.playerAAppWins ?? 0) : null;
    const appWinsBSnap = isAbsolute ? (appAcc?.playerBAppWins ?? 0) : null;
    const appBonusASnap = isAbsolute ? (appAcc?.playerABonusPoints ?? 0) : null;
    const appBonusBSnap = isAbsolute ? (appAcc?.playerBBonusPoints ?? 0) : null;

    await prisma.pairingManualBaseline.upsert({
      where: { pairingKey: key },
      update: {
        extraWinsA,
        extraWinsB,
        extraBonusA,
        extraBonusB,
        isAbsolute,
        appWinsASnap,
        appWinsBSnap,
        appBonusASnap,
        appBonusBSnap,
        note,
      },
      create: {
        pairingKey: key,
        extraWinsA,
        extraWinsB,
        extraBonusA,
        extraBonusB,
        isAbsolute,
        appWinsASnap,
        appWinsBSnap,
        appBonusASnap,
        appBonusBSnap,
        note,
      },
    });
    written += 1;
  }

  return { written, deleted };
}

export async function getPairingDetail(key: string): Promise<PairingDetailDto | null> {
  const names = parsePairingKey(key);
  if (!names) return null;

  const normalizedKey = pairingKey(names[0], names[1]);
  const map = await getCachedAccumulatedPairings();
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
