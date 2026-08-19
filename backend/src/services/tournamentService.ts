import { randomBytes } from "crypto";
import { generateSecretToken } from "../lib/secretToken.js";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import {
  normalizeTournamentConfig,
  type TournamentConfig,
} from "./tournamentConfig.js";
import { createGameSession } from "./sessionService.js";

export const TOURNAMENT_STATUS = {
  OPEN: "OPEN",
  RUNNING: "RUNNING",
  FINISHED: "FINISHED",
} as const;

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MIN_ENTRIES = 2;
const MAX_ENTRIES_CAP = 64;
const DEFAULT_MAX_ENTRIES = 32;
const GROUP_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export class TournamentNotFoundError extends Error {
  constructor() {
    super("Tournament not found");
    this.name = "TournamentNotFoundError";
  }
}

export class TournamentForbiddenError extends Error {
  constructor(message = "Host-Token ungültig") {
    super(message);
    this.name = "TournamentForbiddenError";
  }
}

export class TournamentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TournamentConflictError";
  }
}

export class TournamentInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TournamentInputError";
  }
}

async function generateUniqueTournamentCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    let code = "";
    const buf = randomBytes(8);
    for (let i = 0; i < 8; i += 1) {
      code += INVITE_CHARS[buf[i]! % INVITE_CHARS.length];
    }
    const existing = await tx.tournament.findUnique({
      where: { inviteCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Could not allocate tournament invite code");
}

function normalizeModeKey(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "league";
  const key = raw.trim().toLowerCase().slice(0, 32);
  if (!/^[a-z0-9_-]+$/.test(key)) {
    throw new TournamentInputError("Ungültiger modeKey");
  }
  return key;
}

function normalizeMaxEntries(raw: unknown): number {
  if (raw === undefined || raw === null || raw === "") return DEFAULT_MAX_ENTRIES;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < MIN_ENTRIES || n > MAX_ENTRIES_CAP) {
    throw new TournamentInputError(
      `maxEntries muss zwischen ${MIN_ENTRIES} und ${MAX_ENTRIES_CAP} liegen`,
    );
  }
  return n;
}

function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().slice(0, 48);
  return name.length > 0 ? name : null;
}

function normalizeDisplayName(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new TournamentInputError("displayName erforderlich");
  }
  return raw.trim().slice(0, 32);
}

function parseStoredConfig(raw: string | null): unknown {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return {};
  }
}

function configFromRow(modeKey: string, raw: string | null): TournamentConfig {
  try {
    return normalizeTournamentConfig(modeKey, parseStoredConfig(raw));
  } catch {
    return normalizeTournamentConfig(modeKey, {});
  }
}

function shuffleArray<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function buildRoundRobin(entryIds: readonly string[]) {
  if (entryIds.length < 2) return [] as { roundIndex: number; pairs: [string, string][] }[];
  const ids = [...entryIds];
  const isOdd = ids.length % 2 === 1;
  if (isOdd) ids.push("__BYE__");
  const rounds: { roundIndex: number; pairs: [string, string][] }[] = [];
  const slots = [...ids];
  const totalRounds = slots.length - 1;
  const half = slots.length / 2;

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < half; i += 1) {
      const a = slots[i]!;
      const b = slots[slots.length - 1 - i]!;
      if (a !== "__BYE__" && b !== "__BYE__") {
        pairs.push(roundIndex % 2 === 0 ? [a, b] : [b, a]);
      }
    }
    rounds.push({ roundIndex: roundIndex + 1, pairs });

    const fixed = slots[0]!;
    const rotating = slots.slice(1);
    rotating.unshift(rotating.pop()!);
    slots.splice(0, slots.length, fixed, ...rotating);
  }
  return rounds;
}

function distributeIntoGroups<T>(entries: readonly T[], groupSize: number): T[][] {
  const groupCount = Math.max(1, Math.ceil(entries.length / groupSize));
  const groups = Array.from({ length: groupCount }, () => [] as T[]);
  entries.forEach((entry, index) => {
    groups[index % groupCount]!.push(entry);
  });
  return groups;
}

function groupNameForIndex(index: number): string {
  const label = GROUP_LABELS[index] ?? String(index + 1);
  return `Gruppe ${label}`;
}

function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

function toTournamentDto(
  row: {
    id: string;
    inviteCode: string;
    name: string | null;
    modeKey: string;
    status: string;
    maxEntries: number;
    config: string | null;
    createdAt: Date;
    entries?: {
      id: string;
      displayName: string;
      playerId: string | null;
      orderIndex: number;
      joinedAt: Date;
    }[];
    groups?: {
      id: string;
      name: string;
      sortOrder: number;
      standings?: {
        id: string;
        rank: number;
        matchesPlayed: number;
        wins: number;
        draws: number;
        losses: number;
        points: number;
        totalScoreDiff: number;
        totalScoreFor: number;
        totalScoreAgainst: number;
        entry: {
          id: string;
          displayName: string;
          playerId: string | null;
        };
      }[];
    }[];
    rounds?: {
      id: string;
      groupId: string | null;
      phase: string;
      roundIndex: number;
      legIndex: number;
      title: string;
      matches?: {
        id: string;
        phase: string;
        matchIndex: number;
        status: string;
        homeScore: number | null;
        awayScore: number | null;
        homePointsAwarded: number | null;
        awayPointsAwarded: number | null;
        tieBreakNeeded: boolean;
        winnerEntryId: string | null;
        groupId: string | null;
        sessionId: string | null;
        sessionInviteCode?: string | null;
        session?: { inviteCode: string } | null;
        homeEntry: {
          id: string;
          displayName: string;
          playerId: string | null;
        };
        awayEntry: {
          id: string;
          displayName: string;
          playerId: string | null;
        };
      }[];
    }[];
  },
  options?: { includeEntries?: boolean },
) {
  const entries = row.entries ?? [];
  const groups = row.groups ?? [];
  const rounds = row.rounds ?? [];
  return {
    id: row.id,
    inviteCode: row.inviteCode,
    name: row.name,
    modeKey: row.modeKey,
    status: row.status,
    maxEntries: row.maxEntries,
    config: configFromRow(row.modeKey, row.config),
    entryCount: entries.length,
    createdAt: row.createdAt.toISOString(),
    ...(options?.includeEntries
      ? {
          entries: entries.map((e) => ({
            id: e.id,
            displayName: e.displayName,
            playerId: e.playerId,
            orderIndex: e.orderIndex,
            joinedAt: e.joinedAt.toISOString(),
          })),
          groups: groups.map((group) => ({
            id: group.id,
            name: group.name,
            sortOrder: group.sortOrder,
            standings: (group.standings ?? []).map((standing) => ({
              id: standing.id,
              rank: standing.rank,
              matchesPlayed: standing.matchesPlayed,
              wins: standing.wins,
              draws: standing.draws,
              losses: standing.losses,
              points: standing.points,
              totalScoreDiff: standing.totalScoreDiff,
              totalScoreFor: standing.totalScoreFor,
              totalScoreAgainst: standing.totalScoreAgainst,
              entry: standing.entry,
            })),
          })),
          rounds: rounds.map((round) => ({
            id: round.id,
            groupId: round.groupId,
            phase: round.phase,
            roundIndex: round.roundIndex,
            legIndex: round.legIndex,
            title: round.title,
            matches: (round.matches ?? []).map((match) => ({
              id: match.id,
              phase: match.phase,
              matchIndex: match.matchIndex,
              status: match.status,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              homePointsAwarded: match.homePointsAwarded,
              awayPointsAwarded: match.awayPointsAwarded,
              tieBreakNeeded: match.tieBreakNeeded,
              winnerEntryId: match.winnerEntryId,
              groupId: match.groupId,
              sessionId: match.sessionId,
              sessionInviteCode: match.session?.inviteCode ?? null,
              homeEntry: match.homeEntry,
              awayEntry: match.awayEntry,
            })),
          })),
        }
      : {}),
  };
}

export async function createTournament(input: {
  name?: unknown;
  modeKey?: unknown;
  maxEntries?: unknown;
  config?: unknown;
}) {
  const name = normalizeName(input.name);
  const modeKey = normalizeModeKey(input.modeKey);
  const maxEntries = normalizeMaxEntries(input.maxEntries);
  let config: TournamentConfig;
  try {
    config = normalizeTournamentConfig(modeKey, input.config ?? {});
  } catch (error) {
    throw new TournamentInputError(
      error instanceof Error ? error.message : "Ungültige Event-Einstellungen",
    );
  }
  const hostToken = generateSecretToken();

  const tournament = await prisma.$transaction(async (tx) => {
    const inviteCode = await generateUniqueTournamentCode(tx);
    return tx.tournament.create({
      data: {
        inviteCode,
        name,
        modeKey,
        maxEntries,
        config: JSON.stringify(config),
        hostToken,
        status: TOURNAMENT_STATUS.OPEN,
      },
      include: { entries: { orderBy: { orderIndex: "asc" } } },
    });
  });

  return {
    tournament: toTournamentDto(tournament, { includeEntries: true }),
    hostToken,
  };
}

export async function getTournamentByInviteCode(
  inviteCode: string,
  hostToken?: string,
) {
  const code = inviteCode.trim().toUpperCase();
  if (!code) throw new TournamentNotFoundError();

  const tournament = await prisma.tournament.findUnique({
    where: { inviteCode: code },
    include: {
      entries: { orderBy: { orderIndex: "asc" } },
      groups: {
        orderBy: { sortOrder: "asc" },
        include: {
          standings: {
            orderBy: [{ rank: "asc" }, { points: "desc" }, { totalScoreDiff: "desc" }],
            include: {
              entry: { select: { id: true, displayName: true, playerId: true } },
            },
          },
        },
      },
      rounds: {
        orderBy: [{ phase: "asc" }, { legIndex: "asc" }, { roundIndex: "asc" }],
        include: {
          matches: {
            orderBy: { matchIndex: "asc" },
            include: {
              homeEntry: { select: { id: true, displayName: true, playerId: true } },
              awayEntry: { select: { id: true, displayName: true, playerId: true } },
              session: { select: { inviteCode: true } },
            },
          },
        },
      },
    },
  });
  if (!tournament) throw new TournamentNotFoundError();

  if (hostToken && hostToken !== tournament.hostToken) {
    throw new TournamentForbiddenError();
  }

  return {
    tournament: toTournamentDto(tournament, { includeEntries: true }),
  };
}

export async function joinTournament(
  inviteCode: string,
  input: { displayName?: unknown; playerId?: unknown },
) {
  const code = inviteCode.trim().toUpperCase();
  const displayName = normalizeDisplayName(input.displayName);
  const playerId =
    typeof input.playerId === "string" && input.playerId.trim()
      ? input.playerId.trim().slice(0, 64)
      : null;

  const result = await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { inviteCode: code },
      include: { entries: true },
    });
    if (!tournament) throw new TournamentNotFoundError();
    if (tournament.status !== TOURNAMENT_STATUS.OPEN) {
      throw new TournamentConflictError("Turnier nimmt keine Anmeldungen mehr an");
    }
    if (tournament.entries.length >= tournament.maxEntries) {
      throw new TournamentConflictError("Turnier ist voll");
    }
    if (
      playerId &&
      tournament.entries.some((e) => e.playerId === playerId)
    ) {
      throw new TournamentConflictError("Spieler bereits angemeldet");
    }

    const entry = await tx.tournamentEntry.create({
      data: {
        tournamentId: tournament.id,
        displayName,
        playerId,
        orderIndex: tournament.entries.length,
      },
    });

    const fresh = await tx.tournament.findUniqueOrThrow({
      where: { id: tournament.id },
      include: { entries: { orderBy: { orderIndex: "asc" } } },
    });

    return { tournament: fresh, entry };
  });

  return {
    tournament: toTournamentDto(result.tournament, { includeEntries: true }),
    entry: {
      id: result.entry.id,
      displayName: result.entry.displayName,
      playerId: result.entry.playerId,
      orderIndex: result.entry.orderIndex,
      joinedAt: result.entry.joinedAt.toISOString(),
    },
  };
}

async function createLeagueStructure(
  tx: Prisma.TransactionClient,
  tournament: {
    id: string;
    modeKey: string;
    config: string | null;
    entries: { id: string }[];
  },
) {
  const config = configFromRow(tournament.modeKey, tournament.config);
  if (!("rounds" in config)) {
    throw new TournamentConflictError("Liga-Konfiguration fehlt");
  }

  const shuffledEntries = shuffleArray(tournament.entries);
  const leagueGroup = await tx.tournamentGroup.create({
    data: {
      tournamentId: tournament.id,
      name: "Liga",
      sortOrder: 0,
    },
  });

  await tx.tournamentGroupStanding.createMany({
    data: shuffledEntries.map((entry) => ({
      tournamentId: tournament.id,
      groupId: leagueGroup.id,
      entryId: entry.id,
    })),
  });

  const baseSchedule = buildRoundRobin(shuffledEntries.map((entry) => entry.id));
  const roundsToCreate: { id: string; roundIndex: number; legIndex: number }[] = [];
  for (let legIndex = 1; legIndex <= config.rounds; legIndex += 1) {
    for (const round of baseSchedule) {
      const createdRound = await tx.tournamentRound.create({
        data: {
          tournamentId: tournament.id,
          groupId: leagueGroup.id,
          phase: "LEAGUE",
          roundIndex: round.roundIndex,
          legIndex,
          title:
            config.rounds > 1
              ? `Spieltag ${round.roundIndex} · Runde ${legIndex}`
              : `Spieltag ${round.roundIndex}`,
        },
      });
      roundsToCreate.push({
        id: createdRound.id,
        roundIndex: round.roundIndex,
        legIndex,
      });
    }
  }

  for (const round of baseSchedule) {
    for (let legIndex = 1; legIndex <= config.rounds; legIndex += 1) {
      const createdRound = roundsToCreate.find(
        (item) => item.roundIndex === round.roundIndex && item.legIndex === legIndex,
      );
      if (!createdRound) continue;
      await tx.tournamentMatch.createMany({
        data: round.pairs.map(([homeEntryId, awayEntryId], pairIndex) => ({
          tournamentId: tournament.id,
          groupId: leagueGroup.id,
          roundId: createdRound.id,
          phase: "LEAGUE",
          matchIndex: pairIndex + 1,
          homeEntryId,
          awayEntryId,
        })),
      });
    }
  }
}

async function createTurnierStructure(
  tx: Prisma.TransactionClient,
  tournament: {
    id: string;
    modeKey: string;
    config: string | null;
    entries: { id: string }[];
  },
) {
  const config = configFromRow(tournament.modeKey, tournament.config);
  if (!("groupSize" in config)) {
    throw new TournamentConflictError("Turnier-Konfiguration fehlt");
  }

  const shuffledEntries = shuffleArray(tournament.entries);
  const groupedEntries = distributeIntoGroups(shuffledEntries, config.groupSize);

  for (let groupIndex = 0; groupIndex < groupedEntries.length; groupIndex += 1) {
    const groupEntries = groupedEntries[groupIndex]!;
    const group = await tx.tournamentGroup.create({
      data: {
        tournamentId: tournament.id,
        name: groupNameForIndex(groupIndex),
        sortOrder: groupIndex,
      },
    });

    await tx.tournamentGroupStanding.createMany({
      data: groupEntries.map((entry) => ({
        tournamentId: tournament.id,
        groupId: group.id,
        entryId: entry.id,
      })),
    });

    const schedule = buildRoundRobin(groupEntries.map((entry) => entry.id));
    for (const round of schedule) {
      const createdRound = await tx.tournamentRound.create({
        data: {
          tournamentId: tournament.id,
          groupId: group.id,
          phase: "GROUP",
          roundIndex: round.roundIndex,
          legIndex: 1,
          title: `${group.name} · Runde ${round.roundIndex}`,
        },
      });

      await tx.tournamentMatch.createMany({
        data: round.pairs.map(([homeEntryId, awayEntryId], pairIndex) => ({
          tournamentId: tournament.id,
          groupId: group.id,
          roundId: createdRound.id,
          phase: "GROUP",
          matchIndex: pairIndex + 1,
          homeEntryId,
          awayEntryId,
        })),
      });
    }
  }
}

function mapHouseRulesToSessionFlags(config: TournamentConfig) {
  return {
    ruleYatzyStreak2: config.houseRules.houseRulesYatzyStreak,
    ruleYatzyTriple: config.houseRules.houseRulesYatzyTriple,
    ruleYatzyStreak2Credit: config.houseRules.houseRulesYatzyStreakCredit,
    ruleYatzyTripleCredit: config.houseRules.houseRulesYatzyTripleCredit,
    ruleUpperRace: config.houseRules.houseRulesUpperRace,
    ruleColumnPoolBonuses: config.houseRules.houseRulesColumnPoolBonuses,
  };
}

export async function createTournamentMatchSession(
  tournamentId: string,
  matchId: string,
  hostToken: string,
) {
  if (!hostToken) throw new TournamentForbiddenError();

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      entries: { orderBy: { orderIndex: "asc" } },
      matches: {
        where: { id: matchId },
        include: {
          session: { select: { inviteCode: true } },
          homeEntry: { select: { id: true, displayName: true, playerId: true } },
          awayEntry: { select: { id: true, displayName: true, playerId: true } },
        },
      },
      groups: {
        orderBy: { sortOrder: "asc" },
        include: {
          standings: {
            orderBy: [{ rank: "asc" }, { points: "desc" }, { totalScoreDiff: "desc" }],
            include: {
              entry: { select: { id: true, displayName: true, playerId: true } },
            },
          },
        },
      },
      rounds: {
        orderBy: [{ phase: "asc" }, { legIndex: "asc" }, { roundIndex: "asc" }],
        include: {
          matches: {
            orderBy: { matchIndex: "asc" },
            include: {
              session: { select: { inviteCode: true } },
              homeEntry: { select: { id: true, displayName: true, playerId: true } },
              awayEntry: { select: { id: true, displayName: true, playerId: true } },
            },
          },
        },
      },
    },
  });

  if (!tournament) throw new TournamentNotFoundError();
  if (tournament.hostToken !== hostToken) throw new TournamentForbiddenError();
  if (tournament.status !== TOURNAMENT_STATUS.RUNNING) {
    throw new TournamentConflictError("Turnier läuft noch nicht");
  }

  const match = tournament.matches[0];
  if (!match) throw new TournamentNotFoundError();
  if (match.sessionId || match.session) {
    const inviteCode = match.session?.inviteCode;
    if (!inviteCode) {
      throw new Error("Session invite code missing");
    }
    return {
      tournament: toTournamentDto(tournament, { includeEntries: true }),
      matchId: match.id,
      sessionInviteCode: inviteCode,
      joinPath: `/multi/join?code=${inviteCode}`,
    };
  }

  const config = configFromRow(tournament.modeKey, tournament.config);
  const sessionResult = await createGameSession(
    config.gameCount,
    2,
    config.useStrategyRules,
    undefined,
    config.showOpponentPool,
    config.poolEndgameEnabled,
    mapHouseRulesToSessionFlags(config),
    match.phase === "KO",
  );

  await prisma.tournamentMatch.update({
    where: { id: match.id },
    data: {
      sessionId: sessionResult.id,
      status: "READY",
    },
  });

  const updated = await getTournamentByInviteCode(tournament.inviteCode, hostToken);
  return {
    ...updated,
    matchId: match.id,
    sessionInviteCode: sessionResult.inviteCode,
    joinPath: `/multi/join?code=${sessionResult.inviteCode}`,
  };
}

function computeKoRoundsCount(bracketSize: number): number {
  // bracketSize ist durch nextPowerOfTwo garantiert eine Zweierpotenz.
  return Math.round(Math.log2(bracketSize));
}

async function ensureKoBracketForTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { groups: true, rounds: true, matches: true },
  });
  if (!tournament) throw new TournamentNotFoundError();
  if (tournament.modeKey !== "turnier") return;

  const alreadyHaveKoRounds = await prisma.tournamentRound.count({
    where: { tournamentId: tournament.id, phase: "KO" },
  });
  if (alreadyHaveKoRounds > 0) return;

  // Nur wenn alle Gruppenmatches fertig sind.
  const allGroupMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: tournament.id, phase: "GROUP" },
    select: { id: true, status: true },
  });
  if (allGroupMatches.length === 0) return;
  if (allGroupMatches.some((m) => m.status !== "FINISHED")) return;

  const config = configFromRow(tournament.modeKey, tournament.config);
  if (!("qualifyPerGroup" in config)) return;
  const qualifyPerGroup = config.qualifyPerGroup;

  // Qualifizierte: Top N pro Gruppe nach Rang (inkl. Diff).
  const groups = await prisma.tournamentGroup.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { sortOrder: "asc" },
    include: {
      standings: {
        orderBy: [{ rank: "asc" }],
        include: { entry: { select: { id: true, playerId: true } } },
      },
    },
  });

  const qualifiedEntryIds: string[] = [];
  for (const group of groups) {
    const top = group.standings
      .filter((s) => s.entry.playerId != null)
      .slice(0, qualifyPerGroup)
      .map((s) => s.entryId);
    qualifiedEntryIds.push(...top);
  }

  if (qualifiedEntryIds.length < 2) return;

  const bracketSize = nextPowerOfTwo(qualifiedEntryIds.length);
  const koRoundsCount = computeKoRoundsCount(bracketSize);

  const maxEntryOrderIndex = await prisma.tournamentEntry.aggregate({
    _max: { orderIndex: true },
    where: { tournamentId: tournament.id },
  });

  const byeEntry = await prisma.tournamentEntry.create({
    data: {
      tournamentId: tournament.id,
      displayName: `BYE`,
      playerId: null,
      orderIndex: maxEntryOrderIndex._max.orderIndex != null ? maxEntryOrderIndex._max.orderIndex + 1 : 0,
    },
  });

  const shuffled = shuffleArray(qualifiedEntryIds);
  const seeding: string[] = [
    ...shuffled,
    ...Array.from({ length: bracketSize - shuffled.length }, () => byeEntry.id),
  ];

  // KO-Runden + Matches anlegen (später werden Participants nach Bedarf gefüllt).
  const koRoundIds: Record<number, string> = {};

  for (let r = 1; r <= koRoundsCount; r += 1) {
    const round = await prisma.tournamentRound.create({
      data: {
        tournamentId: tournament.id,
        phase: "KO",
        roundIndex: r,
        legIndex: 1,
        title: `K.O.-Runde ${r}`,
      },
    });
    koRoundIds[r] = round.id;

    const matchCount = bracketSize / 2 ** r;
    for (let m = 1; m <= matchCount; m += 1) {
      const seedIndex = (m - 1) * 2;
      const homeEntryId = r === 1 ? seeding[seedIndex]! : byeEntry.id;
      const awayEntryId = r === 1 ? seeding[seedIndex + 1]! : byeEntry.id;
      await prisma.tournamentMatch.create({
        data: {
          tournamentId: tournament.id,
          phase: "KO",
          roundId: round.id,
          matchIndex: m,
          groupId: null,
          bracketSlot: m,
          homeEntryId,
          awayEntryId,
          status: "PENDING",
          tieBreakNeeded: false,
        },
      });
    }
  }

  const thirdRound = await prisma.tournamentRound.create({
    data: {
      tournamentId: tournament.id,
      phase: "KO_THIRD",
      roundIndex: koRoundsCount + 1,
      legIndex: 1,
      title: "Spiel um Platz 3",
    },
  });

  const thirdMatch = await prisma.tournamentMatch.create({
    data: {
      tournamentId: tournament.id,
      phase: "KO",
      roundId: thirdRound.id,
      matchIndex: 1,
      groupId: null,
      bracketSlot: 1,
      homeEntryId: byeEntry.id,
      awayEntryId: byeEntry.id,
      status: "PENDING",
      tieBreakNeeded: false,
    },
  });

  const configMatch = config as any;
  const koHouseRules = mapHouseRulesToSessionFlags(configMatch);

  // KO-Auflösung:
  // - Runde 1: echte BYEs (Teilnehmer = byeEntry) können sofort aufgelöst werden.
  // - Runden > 1: ein Match wird nur aufgelöst / mit Session versehen, wenn beide
  //   „Feeder“-Matches der vorherigen Runde bereits FINISHED sind.
  for (let r = 1; r <= koRoundsCount; r += 1) {
    const roundId = koRoundIds[r]!;
    const roundMatches = await prisma.tournamentMatch.findMany({
      where: { roundId, phase: "KO" },
      orderBy: { matchIndex: "asc" },
      include: { homeEntry: true, awayEntry: true },
    });

    for (const match of roundMatches) {
      if (r === 1) {
        // Nur in Runde 1 können wir sicher zwischen „echtem Bye“ und „Platzhalter“ unterscheiden.
        if (match.homeEntryId === byeEntry.id || match.awayEntryId === byeEntry.id) {
          const winnerEntryId =
            match.homeEntryId === byeEntry.id
              ? match.awayEntryId
              : match.homeEntryId;

          await prisma.tournamentMatch.update({
            where: { id: match.id },
            data: {
              status: "FINISHED",
              winnerEntryId,
              homeScore: null,
              awayScore: null,
              homePointsAwarded:
                winnerEntryId === match.homeEntryId ? 1 : 0,
              awayPointsAwarded:
                winnerEntryId === match.awayEntryId ? 1 : 0,
              tieBreakNeeded: false,
            },
          });
          continue;
        }

        if (!match.sessionId) {
          const sessionResult = await createGameSession(
            configMatch.gameCount,
            2,
            configMatch.useStrategyRules,
            undefined,
            configMatch.showOpponentPool,
            configMatch.poolEndgameEnabled,
            koHouseRules,
            true,
          );

          await prisma.tournamentMatch.update({
            where: { id: match.id },
            data: { sessionId: sessionResult.id, status: "READY" },
          });
        }
        continue;
      }

      // r > 1: Match ist nur entscheidbar, wenn beide Feeder-Matches fertig sind.
      const feederHomeIndex = match.matchIndex * 2 - 1;
      const feederAwayIndex = match.matchIndex * 2;
      const prevRoundId = koRoundIds[r - 1]!;

      const [feederHome, feederAway] = await Promise.all([
        prisma.tournamentMatch.findFirst({
          where: { roundId: prevRoundId, matchIndex: feederHomeIndex },
          select: { id: true, status: true, winnerEntryId: true },
        }),
        prisma.tournamentMatch.findFirst({
          where: { roundId: prevRoundId, matchIndex: feederAwayIndex },
          select: { id: true, status: true, winnerEntryId: true },
        }),
      ]);

      if (!feederHome || !feederAway) continue;
      if (
        feederHome.status !== "FINISHED" ||
        feederAway.status !== "FINISHED" ||
        !feederHome.winnerEntryId ||
        !feederAway.winnerEntryId
      ) {
        continue;
      }

      // Teilnehmer aus den Feeder-Winnern setzen.
      await prisma.tournamentMatch.update({
        where: { id: match.id },
        data: {
          homeEntryId: feederHome.winnerEntryId,
          awayEntryId: feederAway.winnerEntryId,
        },
      });

      const homeIsBye = feederHome.winnerEntryId === byeEntry.id;
      const awayIsBye = feederAway.winnerEntryId === byeEntry.id;

      if (homeIsBye || awayIsBye) {
        const winnerEntryId =
          homeIsBye && awayIsBye
            ? match.homeEntryId
            : homeIsBye
              ? feederAway.winnerEntryId!
              : feederHome.winnerEntryId!;

        await prisma.tournamentMatch.update({
          where: { id: match.id },
          data: {
            status: "FINISHED",
            winnerEntryId,
            homeScore: null,
            awayScore: null,
            homePointsAwarded:
              winnerEntryId === match.homeEntryId ? 1 : 0,
            awayPointsAwarded:
              winnerEntryId === match.awayEntryId ? 1 : 0,
            tieBreakNeeded: false,
          },
        });

        continue;
      }

      // Beide Teilnehmer real → Session erstellen.
      if (!match.sessionId) {
        const sessionResult = await createGameSession(
          configMatch.gameCount,
          2,
          configMatch.useStrategyRules,
          undefined,
          configMatch.showOpponentPool,
          configMatch.poolEndgameEnabled,
          koHouseRules,
          true,
        );

        await prisma.tournamentMatch.update({
          where: { id: match.id },
          data: { sessionId: sessionResult.id, status: "READY" },
        });
      }
    }
  }

  // Wenn beide Semifinals bereits (durch BYEs) fertig sind, setzen wir sofort
  // Teilnehmer fürs 3.-Platz-Match.
  if (koRoundsCount >= 2) {
    const semiRoundId = koRoundIds[koRoundsCount - 1]!;
    const semis = await prisma.tournamentMatch.findMany({
      where: { roundId: semiRoundId, phase: "KO", matchIndex: { in: [1, 2] } },
      orderBy: { matchIndex: "asc" },
      include: { homeEntry: true, awayEntry: true },
    });
    if (
      semis.length === 2 &&
      semis.every((s) => s.status === "FINISHED" && s.winnerEntryId)
    ) {
      const [s1, s2] = semis;
      const loser1 =
        s1.winnerEntryId === s1.homeEntryId ? s1.awayEntryId : s1.homeEntryId;
      const loser2 =
        s2.winnerEntryId === s2.homeEntryId ? s2.awayEntryId : s2.homeEntryId;

      await prisma.tournamentMatch.update({
        where: { id: thirdMatch.id },
        data: { homeEntryId: loser1, awayEntryId: loser2 },
      });

      const thirdWithEntries = await prisma.tournamentMatch.findUnique({
        where: { id: thirdMatch.id },
        include: { homeEntry: true, awayEntry: true },
      });
      if (thirdWithEntries) {
        const homeIsBye = thirdWithEntries.homeEntry.playerId == null;
        const awayIsBye = thirdWithEntries.awayEntry.playerId == null;
        if (homeIsBye || awayIsBye) {
          const winnerEntryId =
            homeIsBye && awayIsBye
              ? thirdWithEntries.homeEntryId
              : homeIsBye
                ? thirdWithEntries.awayEntryId
                : thirdWithEntries.homeEntryId;
          await prisma.tournamentMatch.update({
            where: { id: thirdWithEntries.id },
            data: {
              status: "FINISHED",
              winnerEntryId,
              homePointsAwarded:
                winnerEntryId === thirdWithEntries.homeEntryId ? 1 : 0,
              awayPointsAwarded:
                winnerEntryId === thirdWithEntries.awayEntryId ? 1 : 0,
              tieBreakNeeded: false,
            },
          });
        } else if (!thirdWithEntries.sessionId) {
          const sessionResult = await createGameSession(
            configMatch.gameCount,
            2,
            configMatch.useStrategyRules,
            undefined,
            configMatch.showOpponentPool,
            configMatch.poolEndgameEnabled,
            koHouseRules,
            true,
          );
          await prisma.tournamentMatch.update({
            where: { id: thirdWithEntries.id },
            data: { sessionId: sessionResult.id, status: "READY" },
          });
        }
      }
    }
  }

  // Turnier finalisieren, falls K.O. (inkl. Platz 3, sofern vorhanden) bereits fertig ist.
  const finalRoundId = koRoundIds[koRoundsCount]!;
  const finalMatch = await prisma.tournamentMatch.findFirst({
    where: { roundId: finalRoundId, matchIndex: 1 },
    select: { status: true },
  });

  if (finalMatch?.status === "FINISHED") {
    if (koRoundsCount < 2) {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: "FINISHED" },
      });
      return;
    }

    const thirdStatus = await prisma.tournamentMatch.findUnique({
      where: { id: thirdMatch.id },
      select: { status: true },
    });

    if (thirdStatus?.status === "FINISHED") {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: "FINISHED" },
      });
    }
  }
}

export async function maybeGenerateKoBracketForTournament(
  tournamentId: string,
): Promise<void> {
  await ensureKoBracketForTournament(tournamentId);
}

export async function startTournament(tournamentId: string, hostToken: string) {
  if (!hostToken) throw new TournamentForbiddenError();

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { entries: { orderBy: { orderIndex: "asc" } } },
  });
  if (!tournament) throw new TournamentNotFoundError();
  if (tournament.hostToken !== hostToken) throw new TournamentForbiddenError();
  if (tournament.status !== TOURNAMENT_STATUS.OPEN) {
    throw new TournamentConflictError("Turnier ist nicht mehr in der Lobby");
  }
  if (tournament.entries.length < MIN_ENTRIES) {
    throw new TournamentConflictError(
      `Mindestens ${MIN_ENTRIES} Spieler zum Start nötig`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const existingRounds = await tx.tournamentRound.count({
      where: { tournamentId: tournament.id },
    });
    if (existingRounds > 0) {
      throw new TournamentConflictError("Turnier-Struktur existiert bereits");
    }

    if (tournament.modeKey === "turnier") {
      await createTurnierStructure(tx, tournament);
    } else {
      await createLeagueStructure(tx, tournament);
    }

    return tx.tournament.update({
      where: { id: tournamentId },
      data: { status: TOURNAMENT_STATUS.RUNNING },
      include: {
        entries: { orderBy: { orderIndex: "asc" } },
        groups: {
          orderBy: { sortOrder: "asc" },
          include: {
            standings: {
              orderBy: [{ rank: "asc" }, { points: "desc" }, { totalScoreDiff: "desc" }],
              include: {
                entry: { select: { id: true, displayName: true, playerId: true } },
              },
            },
          },
        },
        rounds: {
          orderBy: [{ phase: "asc" }, { legIndex: "asc" }, { roundIndex: "asc" }],
          include: {
            matches: {
              orderBy: { matchIndex: "asc" },
              include: {
                homeEntry: { select: { id: true, displayName: true, playerId: true } },
                awayEntry: { select: { id: true, displayName: true, playerId: true } },
              session: { select: { inviteCode: true } },
              },
            },
          },
        },
      },
    });
  });

  return {
    tournament: toTournamentDto(updated, { includeEntries: true }),
  };
}
