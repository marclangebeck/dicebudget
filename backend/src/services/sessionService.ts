import { randomBytes } from "crypto";
import { generateSecretToken } from "../lib/secretToken.js";
import type { Prisma } from "@prisma/client";
import {
  MAX_SESSION_PLAYERS,
  MIN_SESSION_PLAYERS,
  fieldCountForGameCount,
  maxRollsForGameCount,
} from "../config.js";
import {
  isValidPlayerId,
  normalizePlayerId,
  playerTokenFromId,
  publicPlayerIdFromStoredName,
} from "../domain/playerIdentity.js";
import { assertValidGameCount, instantiateRun, parseUseStrategyRules } from "./createRun.js";
import { getRunById } from "./getRun.js";
import { RUN_STATUS, isRunTerminal } from "../domain/fieldTypes.js";
import { computeGameBreakdown } from "../domain/gameScoring.js";
import { assertValidScoreForField } from "../domain/fieldScores.js";
import { ForbiddenRunError } from "./runPlayerAuth.js";
import { prisma } from "../db/prisma.js";
import { awardSessionLeaguePoints, getLeagueStandings } from "./leaguePoints.js";
import { invalidatePairingStatsCache } from "./pairingStats.js";
import { normalizeTournamentConfig } from "./tournamentConfig.js";
import { countOpenUpperFields } from "../domain/houseRules.js";

export const SESSION_STATUS = {
  OPEN: "OPEN",
  RUNNING: "RUNNING",
  FINISHED: "FINISHED",
} as const;

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne I,O,0,1

async function generateUniqueInviteCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    let code = "";
    const buf = randomBytes(8);
    for (let i = 0; i < 8; i += 1) {
      code += INVITE_CHARS[buf[i]! % INVITE_CHARS.length];
    }
    const existing = await tx.gameSession.findUnique({
      where: { inviteCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Could not allocate invite code");
}

async function generateUniqueLeagueCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    let code = "";
    const buf = randomBytes(6);
    for (let i = 0; i < 6; i += 1) {
      code += INVITE_CHARS[buf[i]! % INVITE_CHARS.length];
    }
    const existing = await tx.league.findUnique({
      where: { leagueCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Could not allocate league code");
}

export class LeagueNotFoundError extends Error {
  constructor() {
    super("League not found");
    this.name = "LeagueNotFoundError";
  }
}

export class InvalidSessionPlayersError extends Error {
  constructor() {
    super(
      `maxPlayers must be between ${MIN_SESSION_PLAYERS} and ${MAX_SESSION_PLAYERS}`,
    );
    this.name = "InvalidSessionPlayersError";
  }
}

export class SessionNotFoundError extends Error {
  constructor() {
    super("Session not found");
    this.name = "SessionNotFoundError";
  }
}

export class SessionFullError extends Error {
  constructor() {
    super("Session is full");
    this.name = "SessionFullError";
  }
}

export class PlayerAlreadyInSessionError extends Error {
  constructor() {
    super("Dieser Spieler ist der Session bereits beigetreten");
    this.name = "PlayerAlreadyInSessionError";
  }
}

export class SessionFinishedError extends Error {
  constructor() {
    super("Session is finished");
    this.name = "SessionFinishedError";
  }
}

export class InvalidPlayerNameError extends Error {
  constructor() {
    super("playerId must be a valid UUID");
    this.name = "InvalidPlayerNameError";
  }
}

/** Pool-Endspiel ist für diese Session nicht (mehr) verfügbar. */
export class PoolEndgameNotAvailableError extends Error {
  constructor() {
    super("Pool endgame is not available for this session");
    this.name = "PoolEndgameNotAvailableError";
  }
}

/** Ungültige Feldwahl beim Pool-Endspiel (z. B. leeres Feld). */
export class SessionNotReadyError extends Error {
  constructor(
    reason: "pool_endgame" | "runs_open" | "no_players" = "runs_open",
  ) {
    const message =
      reason === "pool_endgame"
        ? "Pool-Endspiel ist noch nicht abgeschlossen."
        : reason === "no_players"
          ? "Keine Spieler in der Session."
          : "Es sind noch nicht alle Mitspieler fertig.";
    super(message);
    this.name = "SessionNotReadyError";
  }
}

export class PoolEndgameInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PoolEndgameInputError";
  }
}

/**
 * Sieger des Pool-Endspiels = Spieler mit dem eindeutig größten Wurf-Pool.
 * Bei Gleichstand an der Spitze bekommt niemand die Verbesserung (null).
 */
export function determinePoolEndgameImprover<
  T extends { id: string; rollsInPool: number },
>(players: T[]): T | null {
  if (players.length < 2) return null;
  const maxPool = Math.max(...players.map((p) => p.rollsInPool));
  const leaders = players.filter((p) => p.rollsInPool === maxPool);
  return leaders.length === 1 ? leaders[0]! : null;
}

function assertValidPlayerId(playerId: string): string {
  const normalized = normalizePlayerId(playerId);
  if (!isValidPlayerId(normalized)) {
    throw new InvalidPlayerNameError();
  }
  return normalized;
}

export function assertValidSessionPlayers(count: number): void {
  if (
    !Number.isInteger(count) ||
    count < MIN_SESSION_PLAYERS ||
    count > MAX_SESSION_PLAYERS
  ) {
    throw new InvalidSessionPlayersError();
  }
}

export type SessionHouseRuleFlags = {
  ruleYatzyStreak2?: boolean;
  ruleYatzyTriple?: boolean;
  ruleYatzyStreak2Credit?: boolean;
  ruleYatzyTripleCredit?: boolean;
  ruleUpperRace?: boolean;
  ruleColumnPoolBonuses?: boolean;
  ruleYatzyEfficiency?: boolean;
};

function sumEnteredDiceScores(
  games: { fields: { score: number | null }[] }[],
): number {
  let sum = 0;
  for (const game of games) {
    for (const field of game.fields) {
      if (field.score !== null) sum += field.score;
    }
  }
  return sum;
}

function parseKoTieBreakRolls(raw: string | null): number[] | null {
  if (!raw) return null;
  const parts = raw.split(",").map((p) => Number(p));
  if (parts.length !== 3) return null;
  if (!parts.every((n) => Number.isInteger(n) && n >= 1 && n <= 6)) return null;
  return parts as number[];
}

function serializeKoTieBreakRolls(rolls: readonly number[]): string {
  return `${rolls[0]},${rolls[1]},${rolls[2]}`;
}

export async function createGameSession(
  gameCount: number,
  maxPlayers: number,
  useStrategyRules = true,
  leagueCode?: string,
  showOpponentPool = false,
  poolEndgameEnabled = false,
  houseRules: SessionHouseRuleFlags = {},
  koTieBreakEnabled = false,
) {
  assertValidGameCount(gameCount);
  assertValidSessionPlayers(maxPlayers);

  const ruleYatzyStreak2 = houseRules.ruleYatzyStreak2 !== false;
  const ruleYatzyTriple = houseRules.ruleYatzyTriple !== false;
  // Gutschrift nur bei explizitem true (Default aus = bisheriges Verhalten)
  const ruleYatzyStreak2Credit = houseRules.ruleYatzyStreak2Credit === true;
  const ruleYatzyTripleCredit = houseRules.ruleYatzyTripleCredit === true;
  const ruleUpperRace = houseRules.ruleUpperRace !== false;
  const ruleColumnPoolBonuses = houseRules.ruleColumnPoolBonuses !== false;
  const ruleYatzyEfficiency = houseRules.ruleYatzyEfficiency === true;

  const session = await prisma.$transaction(async (tx) => {
    const inviteCode = await generateUniqueInviteCode(tx);

    let leagueId: string;
    let roundNumber = 1;

    if (leagueCode) {
      const league = await tx.league.findUnique({
        where: { leagueCode: leagueCode.toUpperCase() },
        include: {
          sessions: {
            select: { roundNumber: true },
            orderBy: { roundNumber: "desc" },
            take: 1,
          },
        },
      });
      if (!league) throw new LeagueNotFoundError();
      leagueId = league.id;
      roundNumber = (league.sessions[0]?.roundNumber ?? 0) + 1;
    } else {
      const newLeagueCode = await generateUniqueLeagueCode(tx);
      const league = await tx.league.create({
        data: { leagueCode: newLeagueCode },
      });
      leagueId = league.id;
    }

    return tx.gameSession.create({
      data: {
        inviteCode,
        gameCount,
        maxPlayers,
        useStrategyRules,
        showOpponentPool,
        poolEndgameEnabled: poolEndgameEnabled && useStrategyRules,
        ruleYatzyStreak2: useStrategyRules && ruleYatzyStreak2,
        ruleYatzyTriple: useStrategyRules && ruleYatzyTriple,
        ruleYatzyStreak2Credit:
          useStrategyRules && ruleYatzyStreak2 && ruleYatzyStreak2Credit,
        ruleYatzyTripleCredit:
          useStrategyRules && ruleYatzyTriple && ruleYatzyTripleCredit,
        ruleUpperRace: useStrategyRules && ruleUpperRace,
        ruleColumnPoolBonuses: useStrategyRules && ruleColumnPoolBonuses,
        ruleYatzyEfficiency: useStrategyRules && ruleYatzyEfficiency,
        koTieBreakEnabled,
        status: SESSION_STATUS.OPEN,
        leagueId,
        roundNumber,
      },
      include: { league: { select: { leagueCode: true } } },
    });
  });

  const leagueStandings = await getLeagueStandings(session.leagueId);

  return {
    id: session.id,
    inviteCode: session.inviteCode,
    gameCount: session.gameCount,
    maxPlayers: session.maxPlayers,
    useStrategyRules: session.useStrategyRules,
    showOpponentPool: session.showOpponentPool,
    poolEndgameEnabled: session.poolEndgameEnabled,
    ruleYatzyStreak2: session.ruleYatzyStreak2,
    ruleYatzyTriple: session.ruleYatzyTriple,
    ruleYatzyStreak2Credit: session.ruleYatzyStreak2Credit,
    ruleYatzyTripleCredit: session.ruleYatzyTripleCredit,
    ruleUpperRace: session.ruleUpperRace,
    ruleColumnPoolBonuses: session.ruleColumnPoolBonuses,
    ruleYatzyEfficiency: session.ruleYatzyEfficiency,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    leagueCode: session.league.leagueCode,
    roundNumber: session.roundNumber,
    leagueStandings,
  };
}

export async function getSessionLobbyByInvite(
  inviteCode: string,
  options?: { includeStandings?: boolean },
) {
  const includeStandings = options?.includeStandings !== false;
  const session = await prisma.gameSession.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: {
      league: { select: { leagueCode: true } },
      players: {
        orderBy: { orderIndex: "asc" },
        include: {
          run: {
            select: {
              status: true,
              totalScore: true,
              rollsInPool: true,
              games: {
                select: {
                  fields: { select: { score: true, fieldType: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  const leagueStandings = includeStandings
    ? await getLeagueStandings(session.leagueId)
    : [];

  const improver = session.poolEndgameImproverId
    ? session.players.find((p) => p.id === session.poolEndgameImproverId)
    : undefined;

  return {
    id: session.id,
    inviteCode: session.inviteCode,
    gameCount: session.gameCount,
    maxPlayers: session.maxPlayers,
    useStrategyRules: session.useStrategyRules,
    showOpponentPool: session.showOpponentPool,
    poolEndgameEnabled: session.poolEndgameEnabled,
    poolEndgameResolved: session.poolEndgameResolved,
    poolEndgameImproverPlayerId: improver
      ? publicPlayerIdFromStoredName(improver.name)
      : null,
    ruleYatzyStreak2: session.ruleYatzyStreak2,
    ruleYatzyTriple: session.ruleYatzyTriple,
    ruleYatzyStreak2Credit: session.ruleYatzyStreak2Credit,
    ruleYatzyTripleCredit: session.ruleYatzyTripleCredit,
    ruleUpperRace: session.ruleUpperRace,
    ruleColumnPoolBonuses: session.ruleColumnPoolBonuses,
    ruleYatzyEfficiency: session.ruleYatzyEfficiency,
    koTieBreakEnabled: session.koTieBreakEnabled,
    koTieBreakPending: session.koTieBreakPending,
    koTieBreakPlayerAId: session.koTieBreakPlayerAId,
    koTieBreakPlayerBId: session.koTieBreakPlayerBId,
    koTieBreakPlayerARolls: parseKoTieBreakRolls(session.koTieBreakPlayerARolls),
    koTieBreakPlayerBRolls: parseKoTieBreakRolls(session.koTieBreakPlayerBRolls),
    koTieBreakWinnerPlayerId: session.koTieBreakWinnerPlayerId,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    leagueCode: session.league.leagueCode,
    roundNumber: session.roundNumber,
    pointsAwarded: session.pointsAwarded,
    playerCount: session.players.length,
    players: session.players.map((p) => ({
      id: p.id,
      playerId: publicPlayerIdFromStoredName(p.name),
      orderIndex: p.orderIndex,
      runFinished: isRunTerminal(p.run.status),
      totalScore: p.run.totalScore,
      /** Nur eingetragene Feldpunkte (ohne oberen Bonus / Extra-Yatzy). */
      diceScore: sumEnteredDiceScores(p.run.games),
      /** Pool nur offenlegen, wenn der Host es für die Partie erlaubt hat. */
      rollsInPool: session.showOpponentPool ? p.run.rollsInPool : null,
      /** Offene Felder oben — nur mit Gegner-Pool-Anzeige. */
      openUpperFields: session.showOpponentPool
        ? countOpenUpperFields(p.run.games)
        : null,
    })),
    allRunsFinished:
      session.players.length > 0 &&
      session.players.every((p) => isRunTerminal(p.run.status)),
    leagueStandings,
    /** Einladungs-Link (statischer Export: Query `?code=`). */
    joinPath: `/multi/join?code=${session.inviteCode}`,
  };
}

/** Rangliste wenn alle Runs beendet oder Zwischenstand. */
export async function getSessionRanking(inviteCode: string) {
  const lobby = await getSessionLobbyByInvite(inviteCode);
  if (!lobby) return null;

  const ranked = [...lobby.players].sort((a, b) => b.totalScore - a.totalScore);

  const winnerFromKoTieBreak =
    lobby.koTieBreakEnabled && lobby.koTieBreakWinnerPlayerId
      ? { playerId: lobby.koTieBreakWinnerPlayerId, totalScore: null }
      : null;

  // In KO-Tie-Break-Phasen: solange nicht aufgelöst, keinen Gewinner anzeigen.
  if (lobby.koTieBreakEnabled && lobby.koTieBreakPending) {
    return {
      ...lobby,
      ranking: ranked.map((p, index) => ({
        rank: index + 1,
        playerId: p.playerId,
        totalScore: p.totalScore,
        finished: p.runFinished,
      })),
      winner: null,
    };
  }

  return {
    ...lobby,
    ranking: ranked.map((p, index) => ({
      rank: index + 1,
      playerId: p.playerId,
      totalScore: p.totalScore,
      finished: p.runFinished,
    })),
    winner:
      winnerFromKoTieBreak
        ? {
            playerId: winnerFromKoTieBreak.playerId,
            // Ko-Tie-Break gewinnt unabhängig vom totalScore; hier nur für
            // UI-Kompatibilität wieder totalScore setzen.
            totalScore:
              lobby.players.find((p) => p.playerId === winnerFromKoTieBreak.playerId)
                ?.totalScore ?? 0,
          }
        : lobby.allRunsFinished && ranked[0]
          ? { playerId: ranked[0].playerId, totalScore: ranked[0].totalScore }
          : null,
  };
}

export async function joinSession(inviteCode: string, playerId: string) {
  const normalizedPlayerId = assertValidPlayerId(playerId);
  const playerToken = playerTokenFromId(normalizedPlayerId);

  const rawCode = inviteCode.toUpperCase();

  const { player, gameCount, useStrategyRules } = await prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.findUnique({
      where: { inviteCode: rawCode },
      include: { players: true },
    });

    if (!session) throw new SessionNotFoundError();
    if (session.status === SESSION_STATUS.FINISHED) throw new SessionFinishedError();
    if (session.players.length >= session.maxPlayers) throw new SessionFullError();

    if (session.players.some((p) => p.name === playerToken)) {
      throw new PlayerAlreadyInSessionError();
    }

    const orderIndex = session.players.length + 1;
    const secretToken = generateSecretToken();

    const run = await instantiateRun(tx, session.gameCount, session.useStrategyRules);

    const player = await tx.player.create({
      data: {
        sessionId: session.id,
        name: playerToken,
        orderIndex,
        secretToken,
        runId: run.id,
      },
    });

    if (session.status === SESSION_STATUS.OPEN) {
      await tx.gameSession.update({
        where: { id: session.id },
        data: { status: SESSION_STATUS.RUNNING },
      });
    }

    return { player, gameCount: session.gameCount, useStrategyRules: session.useStrategyRules };
  });

  const runDto = await getRunById(player.runId);
  if (!runDto) throw new Error("Run creation failed");

  return {
    player: {
      id: player.id,
      playerId: normalizedPlayerId,
      orderIndex: player.orderIndex,
      secretToken: player.secretToken,
      runId: player.runId,
    },
    run: runDto,
    fieldCount: fieldCountForGameCount(gameCount),
    maxRolls: useStrategyRules ? maxRollsForGameCount(gameCount) : null,
  };
}

/** Nach Run-Abschluss prüfen, ob Session beendet werden kann. */
export async function maybeFinishSessionForRun(runId: string) {
  const player = await prisma.player.findUnique({
    where: { runId },
    include: {
      session: { include: { players: { include: { run: true } } } },
    },
  });

  if (!player) return;

  const { session } = player;
  if (session.status === SESSION_STATUS.FINISHED) return;

  const allDone =
    session.players.length > 0 &&
    session.players.every((p) => isRunTerminal(p.run.status));

  if (!allDone) return;

  // Pool-Endspiel: Sieger (größter Pool) darf vor der Punktevergabe ein Feld
  // verbessern. Bis dahin Liga-Punkte zurückhalten.
  if (
    session.poolEndgameEnabled &&
    session.useStrategyRules &&
    !session.poolEndgameResolved
  ) {
    if (session.poolEndgameImproverId == null) {
      const improver = determinePoolEndgameImprover(
        session.players.map((p) => ({ id: p.id, rollsInPool: p.run.rollsInPool })),
      );
      if (improver) {
        await prisma.gameSession.update({
          where: { id: session.id },
          data: { poolEndgameImproverId: improver.id },
        });
        return; // Auf Entscheidung des Siegers warten.
      }
      // Gleichstand → niemand verbessert, direkt auflösen.
      await prisma.gameSession.update({
        where: { id: session.id },
        data: { poolEndgameResolved: true },
      });
    } else {
      return; // Sieger steht fest, hat aber noch nicht entschieden.
    }
  }

  // Liga-/Paarungs-Punkte erst nach Nutzer-Entscheidung („Werten“ / „Nicht werten“).
}

function assertSessionReadyForStatsFinalize(session: {
  players: { run: { status: string } }[];
  poolEndgameEnabled: boolean;
  useStrategyRules: boolean;
  poolEndgameResolved: boolean;
  poolEndgameImproverId: string | null;
}): void {
  if (session.players.length < 1) {
    throw new SessionNotReadyError("no_players");
  }
  if (!session.players.every((p) => isRunTerminal(p.run.status))) {
    throw new SessionNotReadyError("runs_open");
  }
  if (
    session.poolEndgameEnabled &&
    session.useStrategyRules &&
    !session.poolEndgameResolved &&
    session.poolEndgameImproverId
  ) {
    throw new SessionNotReadyError("pool_endgame");
  }
}

/**
 * Multiplayer-Abschluss: Session in Statistik aufnehmen oder bewusst auslassen.
 * Idempotent – nur die erste Entscheidung pro Session zählt (atomarer Claim).
 */
export async function finalizeSessionStats(
  inviteCode: string,
  includeInPairingStats: boolean,
  playerSecret: string | undefined,
) {
  const session = await prisma.gameSession.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: {
      players: {
        orderBy: { orderIndex: "asc" },
        include: { run: { select: { status: true, totalScore: true } } },
      },
    },
  });

  if (!session) throw new SessionNotFoundError();

  const token = playerSecret?.trim();
  const player = session.players.find((p) => p.secretToken === token);
  if (!token || !player) throw new ForbiddenRunError();

  if (session.pointsAwarded) {
    return getSessionRanking(session.inviteCode);
  }

  assertSessionReadyForStatsFinalize(session);

  // Paarungs-Statistik braucht mindestens zwei Spieler in der Session.
  const effectiveIncludeInPairingStats =
    includeInPairingStats && session.players.length >= 2 && !session.koTieBreakEnabled;

  // KO-Tie-Break Phase: Bei totalScore-Unentschieden müssen zuerst die 3 KO-Würfe
  // eingetragen werden. Solange das nicht passiert ist, darf keine Session als
  // „fertig gewertet“ werden.
  if (session.koTieBreakEnabled && session.players.length === 2) {
    const [a, b] = session.players;
    const aScore = a.run.totalScore;
    const bScore = b.run.totalScore;

    const tie = aScore === bScore;
    let pending = session.koTieBreakPending;

    if (tie && !pending && !session.koTieBreakWinnerPlayerId) {
      const aPublicId = publicPlayerIdFromStoredName(a.name);
      const bPublicId = publicPlayerIdFromStoredName(b.name);

      await prisma.gameSession.update({
        where: { id: session.id },
        data: {
          koTieBreakPending: true,
          koTieBreakPlayerAId: aPublicId,
          koTieBreakPlayerBId: bPublicId,
          koTieBreakPlayerARolls: null,
          koTieBreakPlayerBRolls: null,
          koTieBreakWinnerPlayerId: null,
        },
      });
      pending = true;
    }

    // Falls Tie-Break noch nicht abgeschlossen ist: keine Punkte vergeben /
    // keine Session beenden.
    if (pending) {
      return getSessionRanking(session.inviteCode);
    }
  }

  if (effectiveIncludeInPairingStats) {
    const awarded = await awardSessionLeaguePoints(session.id);
    if (!awarded) {
      // Race verloren oder Award nicht möglich — Flags nicht überschreiben.
      const afterAward = await prisma.gameSession.findUnique({
        where: { id: session.id },
        select: { pointsAwarded: true },
      });
      if (!afterAward?.pointsAwarded) {
        await prisma.gameSession.updateMany({
          where: { id: session.id, pointsAwarded: false },
          data: {
            pointsAwarded: true,
            includeInPairingStats: true,
            status: SESSION_STATUS.FINISHED,
          },
        });
      }
    }
  } else {
    await prisma.gameSession.updateMany({
      where: { id: session.id, pointsAwarded: false },
      data: {
        pointsAwarded: true,
        includeInPairingStats: false,
        status: SESSION_STATUS.FINISHED,
      },
    });
  }

  // Falls diese Session zu einem Tournament-Match gehört, Ergebnis zurückschreiben
  // (inkl. Tabellen-Updates für Liga/Gruppe).
  await maybeFinalizeTournamentMatchFromSession({
    sessionId: session.id,
    phaseHint: session.koTieBreakEnabled ? "KO" : undefined,
    koTieBreakWinnerPlayerId: session.koTieBreakWinnerPlayerId ?? undefined,
    players: session.players.map((p) => ({
      publicPlayerId: publicPlayerIdFromStoredName(p.name),
      totalScore: p.run.totalScore,
    })),
  });

  invalidatePairingStatsCache();

  return getSessionRanking(session.inviteCode);
}

function mapHouseRulesToSessionFlags(config: {
  houseRules?: {
    houseRulesYatzyStreak?: boolean;
    houseRulesYatzyStreakCredit?: boolean;
    houseRulesYatzyTriple?: boolean;
    houseRulesYatzyTripleCredit?: boolean;
    houseRulesUpperRace?: boolean;
    houseRulesColumnPoolBonuses?: boolean;
  };
}) {
  // KO / Tournament-Session verwenden nur die vom Session-System unterstützten Flags.
  return {
    ruleYatzyStreak2: config.houseRules?.houseRulesYatzyStreak ?? false,
    ruleYatzyTriple: config.houseRules?.houseRulesYatzyTriple ?? false,
    ruleYatzyStreak2Credit: config.houseRules?.houseRulesYatzyStreakCredit ?? false,
    ruleYatzyTripleCredit: config.houseRules?.houseRulesYatzyTripleCredit ?? false,
    ruleUpperRace: config.houseRules?.houseRulesUpperRace ?? false,
    ruleColumnPoolBonuses: config.houseRules?.houseRulesColumnPoolBonuses ?? false,
  };
}

async function createKoSessionForTournamentMatch(
  tournamentId: string,
  matchId: string,
) {
  const existingMatch = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      sessionId: true,
      status: true,
      homeEntry: { select: { playerId: true } },
      awayEntry: { select: { playerId: true } },
    },
  });
  if (!existingMatch) return;
  if (existingMatch.sessionId) return;
  if (!existingMatch.homeEntry.playerId || !existingMatch.awayEntry.playerId) return;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { modeKey: true, config: true },
  });
  if (!tournament) return;

  const raw = tournament.config ? JSON.parse(tournament.config) : {};
  const config = normalizeTournamentConfig(tournament.modeKey, raw);
  const matchConfig = config as any;

  const sessionResult = await createGameSession(
    matchConfig.gameCount,
    2,
    matchConfig.useStrategyRules,
    undefined,
    matchConfig.showOpponentPool,
    matchConfig.poolEndgameEnabled,
    mapHouseRulesToSessionFlags(matchConfig),
    true,
  );

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { sessionId: sessionResult.id, status: "READY" },
  });
}

async function maybeFinishLeagueTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { modeKey: true, status: true },
  });
  if (!tournament) return;
  if (tournament.modeKey !== "league") return;
  if (tournament.status === "FINISHED") return;

  const leagueMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, phase: "LEAGUE" },
    select: { status: true },
  });
  if (leagueMatches.length === 0) return;
  if (leagueMatches.some((match) => match.status !== "FINISHED")) return;

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "FINISHED" },
  });
}

async function updateThirdPlaceForTournament(tournamentId: string) {
  const koRounds = await prisma.tournamentRound.findMany({
    where: { tournamentId, phase: "KO" },
    select: { id: true, roundIndex: true },
  });
  if (koRounds.length < 2) return;

  const numElimRounds = Math.max(...koRounds.map((r) => r.roundIndex));
  const semifinalRoundIndex = numElimRounds - 1;
  const thirdRoundIndex = numElimRounds + 1;

  const semifinalRound = koRounds.find((r) => r.roundIndex === semifinalRoundIndex);
  if (!semifinalRound) return;

  const thirdRound = await prisma.tournamentRound.findFirst({
    where: { tournamentId, phase: "KO_THIRD", roundIndex: thirdRoundIndex },
    select: { id: true },
  });
  if (!thirdRound) return;

  const semis = await prisma.tournamentMatch.findMany({
    where: {
      roundId: semifinalRound.id,
      matchIndex: { in: [1, 2] },
    },
    orderBy: { matchIndex: "asc" },
    include: { homeEntry: true, awayEntry: true },
  });
  if (semis.length !== 2) return;
  if (semis.some((m) => m.status !== "FINISHED" || !m.winnerEntryId)) return;

  const [s1, s2] = semis;
  const loser1 =
    s1.winnerEntryId === s1.homeEntryId ? s1.awayEntryId : s1.homeEntryId;
  const loser2 =
    s2.winnerEntryId === s2.homeEntryId ? s2.awayEntryId : s2.homeEntryId;

  const thirdMatch = await prisma.tournamentMatch.findFirst({
    where: { roundId: thirdRound.id, matchIndex: 1 },
    include: { homeEntry: true, awayEntry: true },
  });
  if (!thirdMatch) return;
  if (thirdMatch.status === "FINISHED") return;

  await prisma.tournamentMatch.update({
    where: { id: thirdMatch.id },
    data: { homeEntryId: loser1, awayEntryId: loser2 },
  });

  const updatedThird = await prisma.tournamentMatch.findUnique({
    where: { id: thirdMatch.id },
    include: { homeEntry: true, awayEntry: true },
  });
  if (!updatedThird) return;

  const homeIsBye = updatedThird.homeEntry.playerId == null;
  const awayIsBye = updatedThird.awayEntry.playerId == null;

  if (homeIsBye || awayIsBye) {
    const winnerEntryId =
      homeIsBye && awayIsBye
        ? updatedThird.homeEntryId
        : homeIsBye
          ? updatedThird.awayEntryId
          : updatedThird.homeEntryId;

    const homePoints = winnerEntryId === updatedThird.homeEntryId ? 1 : 0;
    const awayPoints = winnerEntryId === updatedThird.awayEntryId ? 1 : 0;

    await prisma.tournamentMatch.update({
      where: { id: updatedThird.id },
      data: {
        status: "FINISHED",
        winnerEntryId,
        homeScore: null,
        awayScore: null,
        homePointsAwarded: homePoints,
        awayPointsAwarded: awayPoints,
        tieBreakNeeded: false,
      },
    });

    return;
  }

  if (!updatedThird.sessionId) {
    await createKoSessionForTournamentMatch(tournamentId, updatedThird.id);
  }
}

async function maybeFinishTournamentAfterKo(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!tournament) return;
  if (tournament.status === "FINISHED") return;

  const koRounds = await prisma.tournamentRound.findMany({
    where: { tournamentId, phase: "KO" },
    select: { roundIndex: true },
  });
  if (!koRounds.length) return;

  const numElimRounds = Math.max(...koRounds.map((r) => r.roundIndex));
  const finalRound = await prisma.tournamentRound.findFirst({
    where: { tournamentId, phase: "KO", roundIndex: numElimRounds },
    select: { id: true },
  });
  if (!finalRound) return;

  const finalMatch = await prisma.tournamentMatch.findFirst({
    where: { roundId: finalRound.id, matchIndex: 1 },
    select: { status: true },
  });
  if (!finalMatch || finalMatch.status !== "FINISHED") return;

  // Bei nur 2 Teilnehmern gibt es kein echtes 3.-Platz-Spiel.
  if (numElimRounds < 2) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "FINISHED" },
    });
    return;
  }

  const thirdRound = await prisma.tournamentRound.findFirst({
    where: { tournamentId, phase: "KO_THIRD", roundIndex: numElimRounds + 1 },
    select: { id: true },
  });

  if (!thirdRound) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "FINISHED" },
    });
    return;
  }

  const thirdMatch = await prisma.tournamentMatch.findFirst({
    where: { roundId: thirdRound.id, matchIndex: 1 },
    select: { status: true },
  });

  if (thirdMatch?.status === "FINISHED") {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "FINISHED" },
    });
  }
}

async function propagateKoWinnerToNext(tournamentId: string, params: {
  currentRoundIndex: number;
  matchIndex: number;
  winnerEntryId: string;
}) {
  const koRounds = await prisma.tournamentRound.findMany({
    where: { tournamentId, phase: "KO" },
    select: { id: true, roundIndex: true },
  });
  if (!koRounds.length) return;

  const numElimRounds = Math.max(...koRounds.map((r) => r.roundIndex));
  if (params.currentRoundIndex >= numElimRounds) return;

  let currentRoundIndex = params.currentRoundIndex;
  let currentMatchIndex = params.matchIndex;
  let winnerEntryId = params.winnerEntryId;

  while (currentRoundIndex < numElimRounds) {
    const currentRound = koRounds.find((r) => r.roundIndex === currentRoundIndex);
    if (!currentRound) return;

    const nextRoundIndex = currentRoundIndex + 1;
    const nextRound = koRounds.find((r) => r.roundIndex === nextRoundIndex);
    if (!nextRound) return;

    const nextMatchIndex = Math.ceil(currentMatchIndex / 2);
    const nextMatch = await prisma.tournamentMatch.findFirst({
      where: { roundId: nextRound.id, matchIndex: nextMatchIndex },
      include: { homeEntry: true, awayEntry: true },
    });
    if (!nextMatch) return;

    // Der „andere“ Feeder liefert den zweiten Teilnehmer in der nächsten Runde.
    const siblingMatchIndex =
      currentMatchIndex % 2 === 1 ? currentMatchIndex + 1 : currentMatchIndex - 1;
    const siblingMatch = await prisma.tournamentMatch.findFirst({
      where: { roundId: currentRound.id, matchIndex: siblingMatchIndex },
      select: { status: true, winnerEntryId: true },
    });

    if (!siblingMatch || siblingMatch.status !== "FINISHED" || !siblingMatch.winnerEntryId) {
      // Der nächste Match ist noch nicht entscheidbar.
      // (Die zweite Teilnehmer-Quelle ist noch offen.)
      return;
    }

    const siblingWinnerEntryId = siblingMatch.winnerEntryId;

    // Teilnehmer in der nächsten Runde setzen (beide Slots).
    await prisma.tournamentMatch.update({
      where: { id: nextMatch.id },
      data:
        currentMatchIndex % 2 === 1
          ? { homeEntryId: winnerEntryId, awayEntryId: siblingWinnerEntryId }
          : { awayEntryId: winnerEntryId, homeEntryId: siblingWinnerEntryId },
    });

    const updatedNext = await prisma.tournamentMatch.findUnique({
      where: { id: nextMatch.id },
      include: { homeEntry: true, awayEntry: true },
    });
    if (!updatedNext) return;

    const homeIsBye = updatedNext.homeEntry.playerId == null;
    const awayIsBye = updatedNext.awayEntry.playerId == null;

    // Wenn mindestens ein Slot ein „Bye“-Platzhalter ist, kann der Match direkt entschieden werden.
    if (homeIsBye || awayIsBye) {
      const winnerEntryId2 =
        homeIsBye && awayIsBye
          ? updatedNext.homeEntryId
          : homeIsBye
            ? updatedNext.awayEntryId
            : updatedNext.homeEntryId;

      const homePoints = winnerEntryId2 === updatedNext.homeEntryId ? 1 : 0;
      const awayPoints = winnerEntryId2 === updatedNext.awayEntryId ? 1 : 0;

      await prisma.tournamentMatch.update({
        where: { id: updatedNext.id },
        data: {
          status: "FINISHED",
          winnerEntryId: winnerEntryId2,
          homeScore: null,
          awayScore: null,
          homePointsAwarded: homePoints,
          awayPointsAwarded: awayPoints,
          tieBreakNeeded: false,
        },
      });

      currentRoundIndex = nextRoundIndex;
      currentMatchIndex = updatedNext.matchIndex;
      winnerEntryId = winnerEntryId2;
      continue;
    }

    // Beide Teilnehmer real → wenn noch keine Session existiert, erstellen wir sie.
    if (!updatedNext.sessionId) {
      await createKoSessionForTournamentMatch(tournamentId, updatedNext.id);
    }
    break;
  }
}

async function maybeFinalizeTournamentMatchFromSession(input: {
  sessionId: string;
  phaseHint?: string;
  koTieBreakWinnerPlayerId?: string;
  players: { publicPlayerId: string; totalScore: number }[];
}): Promise<void> {
  const tournamentMatch = await prisma.tournamentMatch.findUnique({
    where: { sessionId: input.sessionId },
    include: {
      homeEntry: true,
      awayEntry: true,
      round: { select: { roundIndex: true, phase: true } },
    },
  });
  if (!tournamentMatch) return;
  if (tournamentMatch.status === "FINISHED") return;

  const homeEntryId = tournamentMatch.homeEntryId;
  const awayEntryId = tournamentMatch.awayEntryId;
  const groupId = tournamentMatch.groupId;

  const homePlayerId = tournamentMatch.homeEntry.playerId;
  const awayPlayerId = tournamentMatch.awayEntry.playerId;
  if (!homePlayerId || !awayPlayerId) return;

  const playerTotals = new Map(input.players.map((p) => [p.publicPlayerId, p.totalScore]));
  const homeScore = playerTotals.get(homePlayerId);
  const awayScore = playerTotals.get(awayPlayerId);
  if (homeScore == null || awayScore == null) return;

  const tie = homeScore === awayScore;
  const phase = tournamentMatch.phase;

  if (phase === "KO") {
    const winnerPlayerId = tie
      ? input.koTieBreakWinnerPlayerId ?? null
      : homeScore > awayScore
        ? homePlayerId
        : awayPlayerId;

    const winnerEntryId =
      winnerPlayerId === homePlayerId
        ? homeEntryId
        : winnerPlayerId === awayPlayerId
          ? awayEntryId
          : null;

    const homePoints = winnerEntryId === homeEntryId ? 1 : 0;
    const awayPoints = winnerEntryId === awayEntryId ? 1 : 0;

    await prisma.tournamentMatch.update({
      where: { id: tournamentMatch.id },
      data: {
        status: "FINISHED",
        homeScore,
        awayScore,
        homePointsAwarded: homePoints,
        awayPointsAwarded: awayPoints,
        winnerEntryId,
        tieBreakNeeded: false,
      },
    });

    if (typeof tournamentMatch.round?.roundIndex === "number") {
      await propagateKoWinnerToNext(tournamentMatch.tournamentId, {
        currentRoundIndex: tournamentMatch.round.roundIndex,
        matchIndex: tournamentMatch.matchIndex,
        winnerEntryId: winnerEntryId ?? homeEntryId,
      });
      await updateThirdPlaceForTournament(tournamentMatch.tournamentId);
      await maybeFinishTournamentAfterKo(tournamentMatch.tournamentId);
    }

    return;
  }

  if (phase !== "LEAGUE" && phase !== "GROUP") return;
  if (!groupId) return;

  const homeDiff = homeScore - awayScore;
  const awayDiff = -homeDiff;

  let homePoints: number;
  let awayPoints: number;
  let homeWinsInc: number;
  let awayWinsInc: number;
  let homeDrawsInc: number;
  let awayDrawsInc: number;
  let homeLossesInc: number;
  let awayLossesInc: number;

  if (tie) {
    homePoints = 0.5;
    awayPoints = 0.5;
    homeWinsInc = 0;
    awayWinsInc = 0;
    homeDrawsInc = 1;
    awayDrawsInc = 1;
    homeLossesInc = 0;
    awayLossesInc = 0;
  } else if (homeScore > awayScore) {
    homePoints = 1;
    awayPoints = 0;
    homeWinsInc = 1;
    awayWinsInc = 0;
    homeDrawsInc = 0;
    awayDrawsInc = 0;
    homeLossesInc = 0;
    awayLossesInc = 1;
  } else {
    homePoints = 0;
    awayPoints = 1;
    homeWinsInc = 0;
    awayWinsInc = 1;
    homeDrawsInc = 0;
    awayDrawsInc = 0;
    homeLossesInc = 1;
    awayLossesInc = 0;
  }

  await prisma.$transaction(async (tx) => {
    const [homeStanding, awayStanding] = await Promise.all([
      tx.tournamentGroupStanding.findFirst({
        where: { groupId, entryId: homeEntryId },
      }),
      tx.tournamentGroupStanding.findFirst({
        where: { groupId, entryId: awayEntryId },
      }),
    ]);

    if (!homeStanding || !awayStanding) return;

    await Promise.all([
      tx.tournamentGroupStanding.update({
        where: { id: homeStanding.id },
        data: {
          matchesPlayed: homeStanding.matchesPlayed + 1,
          wins: homeStanding.wins + homeWinsInc,
          draws: homeStanding.draws + homeDrawsInc,
          losses: homeStanding.losses + homeLossesInc,
          points: homeStanding.points + homePoints,
          totalScoreDiff: homeStanding.totalScoreDiff + homeDiff,
          totalScoreFor: homeStanding.totalScoreFor + homeScore,
          totalScoreAgainst: homeStanding.totalScoreAgainst + awayScore,
        },
      }),
      tx.tournamentGroupStanding.update({
        where: { id: awayStanding.id },
        data: {
          matchesPlayed: awayStanding.matchesPlayed + 1,
          wins: awayStanding.wins + awayWinsInc,
          draws: awayStanding.draws + awayDrawsInc,
          losses: awayStanding.losses + awayLossesInc,
          points: awayStanding.points + awayPoints,
          totalScoreDiff: awayStanding.totalScoreDiff + awayDiff,
          totalScoreFor: awayStanding.totalScoreFor + awayScore,
          totalScoreAgainst: awayStanding.totalScoreAgainst + homeScore,
        },
      }),
      tx.tournamentMatch.update({
        where: { id: tournamentMatch.id },
        data: {
          status: "FINISHED",
          homeScore,
          awayScore,
          homePointsAwarded: homePoints,
          awayPointsAwarded: awayPoints,
          winnerEntryId: tie ? null : homeScore > awayScore ? homeEntryId : awayEntryId,
          tieBreakNeeded: false,
        },
      }),
    ]);

    const ordered = await tx.tournamentGroupStanding.findMany({
      where: { groupId },
    });

    ordered.sort(
      (a, b) =>
        (b.points ?? 0) - (a.points ?? 0) ||
        (b.totalScoreDiff ?? 0) - (a.totalScoreDiff ?? 0) ||
        (b.totalScoreFor ?? 0) - (a.totalScoreFor ?? 0) ||
        a.entryId.localeCompare(b.entryId),
    );

    for (let i = 0; i < ordered.length; i += 1) {
      await tx.tournamentGroupStanding.update({
        where: { id: ordered[i]!.id },
        data: { rank: i + 1 },
      });
    }
  });

  // Sobald die Gruppenphase vollständig abgeschlossen ist, erzeugen wir automatisch
  // die K.O.-Struktur (Turnier-Modus).
  if (phase === "GROUP") {
    const { maybeGenerateKoBracketForTournament } = await import(
      "./tournamentService.js"
    );
    await maybeGenerateKoBracketForTournament(tournamentMatch.tournamentId);
  }

  if (phase === "LEAGUE") {
    await maybeFinishLeagueTournament(tournamentMatch.tournamentId);
  }

  const { maybeAutoReleaseNextScheduleWave } = await import(
    "./tournamentService.js"
  );
  await maybeAutoReleaseNextScheduleWave(tournamentMatch.tournamentId);
}

/**
 * KO-Tie-Break (3 Würfe): Spieler reichen jeweils ihre 3 Augenzahlen ein.
 * Danach entscheidet der Server die Gewinnerquote (höhere Augenzahl je Wurf)
 * und beendet die Tie-Break-Phase.
 */
export async function submitKoTieBreakRolls(
  inviteCode: string,
  rolls: unknown,
  playerSecret: string | undefined,
) {
  const session = await prisma.gameSession.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: {
      players: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!session) throw new SessionNotFoundError();

  const token = playerSecret?.trim();
  const player = session.players.find((p) => p.secretToken === token);
  if (!token || !player) throw new ForbiddenRunError();

  if (!session.koTieBreakEnabled) {
    throw new Error("ko_tie_break_disabled");
  }

  // Fertig/abgebrochen → nichts mehr schreiben.
  if (!session.koTieBreakPending || session.koTieBreakWinnerPlayerId) {
    return getSessionRanking(session.inviteCode);
  }

  const parsedRolls = Array.isArray(rolls) ? rolls : null;
  if (!parsedRolls) throw new Error("ko_tie_break_rolls_invalid");
  const values = parsedRolls.map((n) => Number(n));
  if (
    values.length !== 3 ||
    !values.every((n) => Number.isInteger(n) && n >= 1 && n <= 6)
  ) {
    throw new Error("ko_tie_break_rolls_invalid");
  }

  const publicId = publicPlayerIdFromStoredName(player.name);
  if (
    publicId !== session.koTieBreakPlayerAId &&
    publicId !== session.koTieBreakPlayerBId
  ) {
    throw new Error("ko_tie_break_player_unknown");
  }

  const rollString = serializeKoTieBreakRolls(values);

  await prisma.$transaction(async (tx) => {
    const current = await tx.gameSession.findUnique({
      where: { id: session.id },
      select: {
        koTieBreakPending: true,
        koTieBreakWinnerPlayerId: true,
        koTieBreakPlayerAId: true,
        koTieBreakPlayerARolls: true,
        koTieBreakPlayerBId: true,
        koTieBreakPlayerBRolls: true,
      },
    });

    if (!current) throw new Error("session_missing_during_tx");
    if (!current.koTieBreakPending || current.koTieBreakWinnerPlayerId) return;

    const nextARolls =
      publicId === current.koTieBreakPlayerAId
        ? rollString
        : current.koTieBreakPlayerARolls;
    const nextBRolls =
      publicId === current.koTieBreakPlayerBId
        ? rollString
        : current.koTieBreakPlayerBRolls;

    const aArr = parseKoTieBreakRolls(nextARolls);
    const bArr = parseKoTieBreakRolls(nextBRolls);

    if (!aArr || !bArr) {
      await tx.gameSession.update({
        where: { id: session.id },
        data: {
          koTieBreakPlayerARolls: nextARolls,
          koTieBreakPlayerBRolls: nextBRolls,
        },
      });
      return;
    }

    let winsA = 0;
    for (let i = 0; i < 3; i += 1) {
      if (aArr[i]! > bArr[i]!) winsA += 1;
    }
    // winsB = 3 - winsA (kann nicht unentschieden sein, da 3 Vergleiche)
    const winnerPublicId = winsA === 2 || winsA === 3 ? current.koTieBreakPlayerAId : current.koTieBreakPlayerBId;

    await tx.gameSession.update({
      where: { id: session.id },
      data: {
        koTieBreakPlayerARolls: nextARolls,
        koTieBreakPlayerBRolls: nextBRolls,
        koTieBreakPending: false,
        koTieBreakWinnerPlayerId: winnerPublicId,
      },
    });
  });

  return getSessionRanking(session.inviteCode);
}

/**
 * Pool-Endspiel auflösen: Der Sieger trägt entweder einen neuen Wert für ein
 * Feld ein (`fieldId` + `score`) oder behält den alten Wert (`keep: true`).
 * Danach werden die Liga-Punkte vergeben und die Session beendet.
 */
export async function resolvePoolEndgame(
  inviteCode: string,
  input: { keep?: boolean; fieldId?: string; score?: number },
  playerSecret: string | undefined,
) {
  const session = await prisma.gameSession.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: { players: true },
  });

  if (!session) throw new SessionNotFoundError();
  if (
    !session.poolEndgameEnabled ||
    session.poolEndgameResolved ||
    !session.poolEndgameImproverId
  ) {
    throw new PoolEndgameNotAvailableError();
  }

  const improver = session.players.find(
    (p) => p.id === session.poolEndgameImproverId,
  );
  if (!improver) throw new PoolEndgameNotAvailableError();

  const token = playerSecret?.trim();
  if (!token || token !== improver.secretToken) throw new ForbiddenRunError();

  const keep = input.keep === true || !input.fieldId;

  if (!keep) {
    const fieldId = input.fieldId!;
    const score = Number(input.score);
    if (!Number.isInteger(score) || score < 0 || score > 999) {
      throw new PoolEndgameInputError("score must be an integer from 0 to 999");
    }

    const field = await prisma.field.findFirst({
      where: { id: fieldId, game: { runId: improver.runId } },
    });
    if (!field) throw new PoolEndgameInputError("Field not found for this run");
    if (field.score === null) {
      throw new PoolEndgameInputError("Field is not scored");
    }
    assertValidScoreForField(field.fieldType, score);

    await prisma.$transaction(async (tx) => {
      await tx.field.update({ where: { id: fieldId }, data: { score } });

      const games = await tx.game.findMany({
        where: { runId: improver.runId },
        include: { fields: true },
      });
      let totalScore = 0;
      for (const game of games) {
        const breakdown = computeGameBreakdown(game.fields, game.extraYatzyBonus);
        await tx.game.update({
          where: { id: game.id },
          data: { score: breakdown.gameTotal },
        });
        totalScore += breakdown.gameTotal;
      }
      await tx.run.update({
        where: { id: improver.runId },
        data: { totalScore },
      });
      await tx.gameSession.update({
        where: { id: session.id },
        data: { poolEndgameResolved: true },
      });
    });
  } else {
    await prisma.gameSession.update({
      where: { id: session.id },
      data: { poolEndgameResolved: true },
    });
  }

  // Stats erst nach Nutzer-Entscheidung auf dem Ergebnis-Screen.
  return getSessionRanking(session.inviteCode);
}
