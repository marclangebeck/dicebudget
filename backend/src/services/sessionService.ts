import { randomBytes } from "crypto";
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
import { RUN_STATUS } from "../domain/fieldTypes.js";
import { computeGameBreakdown } from "../domain/gameScoring.js";
import { assertValidScoreForField } from "../domain/fieldScores.js";
import { ForbiddenRunError } from "./runPlayerAuth.js";
import { prisma } from "../db/prisma.js";
import { awardSessionLeaguePoints, getLeagueStandings } from "./leaguePoints.js";

export const SESSION_STATUS = {
  OPEN: "OPEN",
  RUNNING: "RUNNING",
  FINISHED: "FINISHED",
} as const;

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne I,O,0,1

function generateSecretToken(): string {
  return randomBytes(24).toString("hex");
}

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

export async function createGameSession(
  gameCount: number,
  maxPlayers: number,
  useStrategyRules = true,
  leagueCode?: string,
  showOpponentPool = false,
  poolEndgameEnabled = false,
) {
  assertValidGameCount(gameCount);
  assertValidSessionPlayers(maxPlayers);

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
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    leagueCode: session.league.leagueCode,
    roundNumber: session.roundNumber,
    leagueStandings,
  };
}

export async function getSessionLobbyByInvite(inviteCode: string) {
  const session = await prisma.gameSession.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: {
      league: { select: { leagueCode: true } },
      players: {
        orderBy: { orderIndex: "asc" },
        include: {
          run: { select: { status: true, totalScore: true, rollsInPool: true } },
        },
      },
    },
  });

  if (!session) return null;

  const leagueStandings = await getLeagueStandings(session.leagueId);

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
      runFinished: p.run.status === RUN_STATUS.FINISHED,
      totalScore: p.run.totalScore,
      /** Pool nur offenlegen, wenn der Host es für die Partie erlaubt hat. */
      rollsInPool: session.showOpponentPool ? p.run.rollsInPool : null,
    })),
    allRunsFinished:
      session.players.length > 0 &&
      session.players.every((p) => p.run.status === RUN_STATUS.FINISHED),
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
  return {
    ...lobby,
    ranking: ranked.map((p, index) => ({
      rank: index + 1,
      playerId: p.playerId,
      totalScore: p.totalScore,
      finished: p.runFinished,
    })),
    winner:
      lobby.allRunsFinished && ranked[0]
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
    session.players.every((p) => p.run.status === RUN_STATUS.FINISHED);

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

  await awardSessionLeaguePoints(session.id);
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

  await awardSessionLeaguePoints(session.id);
  return getSessionRanking(session.inviteCode);
}
