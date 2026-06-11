import { prisma } from "../db/prisma.js";
import { computeGameBreakdown } from "../domain/gameScoring.js";
import { isRunTerminal, sortFields } from "../domain/fieldTypes.js";
import {
  buildMatchAnalysis,
  type AnalysisParticipant,
  type AnalysisRun,
  type MatchAnalysisResult,
} from "../domain/matchAnalysis.js";
import { publicPlayerIdFromStoredName } from "../domain/playerIdentity.js";
import { getRunById } from "./getRun.js";
import { RunNotFoundError } from "./playField.js";
import { SessionNotFoundError } from "./sessionService.js";

export class MatchAnalysisNotReadyError extends Error {
  constructor(message = "Match analysis not ready") {
    super(message);
    this.name = "MatchAnalysisNotReadyError";
  }
}

export class MatchAnalysisNotSupportedError extends Error {
  constructor(message = "Match analysis not supported for this session") {
    super(message);
    this.name = "MatchAnalysisNotSupportedError";
  }
}

function runDtoToAnalysisRun(run: NonNullable<Awaited<ReturnType<typeof getRunById>>>): AnalysisRun {
  return {
    gameCount: run.gameCount,
    useStrategyRules: run.useStrategyRules,
    totalScore: run.totalScore,
    totalRollsUsed: run.totalRollsUsed,
    rollsInPool: run.rollsInPool,
    extraYatzyCount: run.extraYatzyCount,
    games: run.games.map((game) => ({
      index: game.index,
      summary: game.summary,
      fields: game.fields.map((field) => ({
        fieldType: field.fieldType,
        score: field.score,
        rollsUsed: field.rollsUsed,
        scoredSequence: field.scoredSequence,
        yatzyDieValue: field.yatzyDieValue,
      })),
    })),
  };
}

function displayName(storedName: string, publicId: string): string {
  return storedName.startsWith("pid:") ? publicId : storedName;
}

async function loadAnalysisRun(runId: string): Promise<AnalysisRun | null> {
  const run = await getRunById(runId);
  if (!run) return null;
  return runDtoToAnalysisRun(run);
}

function assertSessionAnalysisReady(session: {
  poolEndgameEnabled: boolean;
  poolEndgameResolved: boolean;
  players: { run: { status: string } }[];
}): void {
  if (session.poolEndgameEnabled && !session.poolEndgameResolved) {
    throw new MatchAnalysisNotReadyError(
      "Analyse erst nach dem Pool-Endspiel verfügbar.",
    );
  }
  const allFinished = session.players.every((p) => isRunTerminal(p.run.status));
  if (!allFinished) {
    throw new MatchAnalysisNotReadyError(
      "Analyse erst verfügbar, wenn alle Spieler fertig sind.",
    );
  }
}

export type SessionMatchAnalysisResponse = MatchAnalysisResult & {
  inviteCode: string;
  leagueCode: string;
  roundNumber: number;
  finishedAt: string | null;
  viewerPlayerId: string;
  opponentPlayerId: string | null;
  viewerName: string;
  opponentName: string | null;
};

export class MatchAnalysisForbiddenError extends Error {
  constructor(message = "Kein Zugriff auf diese Spielanalyse") {
    super(message);
    this.name = "MatchAnalysisForbiddenError";
  }
}

function assertSessionMatchAnalysisAccess(
  session: { status: string },
  viewerPlayer: { secretToken: string },
  playerSecret: string | undefined,
): void {
  const secret = playerSecret?.trim();
  if (secret) {
    if (secret !== viewerPlayer.secretToken) {
      throw new MatchAnalysisForbiddenError();
    }
    return;
  }

  if (session.status !== "FINISHED") {
    throw new MatchAnalysisForbiddenError(
      "Spielanalyse nur mit Spieler-Geheimnis oder nach Abschluss der Session.",
    );
  }
}

export async function getSessionMatchAnalysis(
  inviteCode: string,
  viewerPlayerId: string,
  playerSecret?: string,
): Promise<SessionMatchAnalysisResponse> {
  const session = await prisma.gameSession.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: {
      league: { select: { leagueCode: true } },
      players: {
        orderBy: { orderIndex: "asc" },
        include: {
          run: { select: { id: true, status: true, finishedAt: true } },
        },
      },
    },
  });

  if (!session) throw new SessionNotFoundError();

  const viewerNorm = viewerPlayerId.trim().toLowerCase();
  const playersWithIds = session.players.map((p) => ({
    ...p,
    publicId: publicPlayerIdFromStoredName(p.name),
  }));

  const viewerPlayer = playersWithIds.find((p) => p.publicId === viewerNorm);
  if (!viewerPlayer) {
    throw new MatchAnalysisNotSupportedError("Spieler gehört nicht zu dieser Session.");
  }

  assertSessionMatchAnalysisAccess(session, viewerPlayer, playerSecret);

  if (session.players.length < 2) {
    throw new MatchAnalysisNotSupportedError(
      "Spielanalyse braucht mindestens zwei Spieler in der Session.",
    );
  }

  assertSessionAnalysisReady(session);

  const analysisRuns = await Promise.all(
    session.players.map((p) => loadAnalysisRun(p.run.id)),
  );
  if (analysisRuns.some((r) => !r)) {
    throw new MatchAnalysisNotReadyError("Spieldaten unvollständig.");
  }

  const participants: AnalysisParticipant[] = playersWithIds.map((player, index) => ({
    playerId: player.publicId,
    playerName: displayName(player.name, player.publicId),
    orderIndex: player.orderIndex,
    run: analysisRuns[index]!,
  }));

  const analysis = buildMatchAnalysis({
    mode: "multi",
    ready: true,
    viewerPlayerId: viewerPlayer.publicId,
    participants,
  });

  const soleComparison = analysis.comparisons.length === 1 ? analysis.comparisons[0]! : null;

  const finishedAt = session.players
    .map((p) => p.run.finishedAt)
    .filter(Boolean)
    .sort((a, b) => (b!.getTime() - a!.getTime()))[0];

  return {
    ...analysis,
    inviteCode: session.inviteCode,
    leagueCode: session.league.leagueCode,
    roundNumber: session.roundNumber,
    finishedAt: finishedAt?.toISOString() ?? null,
    viewerPlayerId: viewerPlayer.publicId,
    opponentPlayerId: soleComparison?.opponentPlayerId ?? null,
    viewerName: displayName(viewerPlayer.name, viewerPlayer.publicId),
    opponentName: soleComparison?.opponentName ?? null,
  };
}

export async function getRunMatchAnalysisSolo(
  runId: string,
): Promise<MatchAnalysisResult> {
  const run = await loadAnalysisRun(runId);
  if (!run) throw new RunNotFoundError();

  const dbRun = await prisma.run.findUnique({
    where: { id: runId },
    select: { status: true },
  });
  if (!dbRun || !isRunTerminal(dbRun.status)) {
    throw new MatchAnalysisNotReadyError("Analyse erst nach Run-Abschluss verfügbar.");
  }

  return buildMatchAnalysis({
    mode: "solo",
    ready: true,
    viewerRun: run,
  });
}

/** Hilfsfunktion: Run aus Rohdaten für Tests / interne Nutzung. */
export function analysisRunFromDbGames(
  runMeta: Omit<AnalysisRun, "games">,
  games: Array<{
    index: number;
    extraYatzyBonus: number;
    fields: Array<{
      fieldType: string;
      score: number | null;
      rollsUsed: number;
      yatzyDieValue?: number | null;
    }>;
  }>,
): AnalysisRun {
  return {
    ...runMeta,
    games: games.map((game) => ({
      index: game.index,
      fields: sortFields(game.fields),
      summary: computeGameBreakdown(sortFields(game.fields), game.extraYatzyBonus),
    })),
  };
}
