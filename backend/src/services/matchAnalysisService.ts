import { prisma } from "../db/prisma.js";
import { computeGameBreakdown } from "../domain/gameScoring.js";
import { FIELD_TYPES_PER_GAME } from "../domain/fieldTypes.js";
import {
  buildMatchAnalysis,
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

function sortFields<T extends { fieldType: string }>(fields: T[]): T[] {
  const order = new Map(FIELD_TYPES_PER_GAME.map((type, index) => [type, index]));
  return [...fields].sort(
    (a, b) => (order.get(a.fieldType as (typeof FIELD_TYPES_PER_GAME)[number]) ?? 0)
      - (order.get(b.fieldType as (typeof FIELD_TYPES_PER_GAME)[number]) ?? 0),
  );
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
        yatzyDieValue: field.yatzyDieValue,
      })),
    })),
  };
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
  const allFinished = session.players.every((p) => p.run.status === "FINISHED");
  if (!allFinished) {
    throw new MatchAnalysisNotReadyError(
      "Analyse erst verfügbar, wenn alle Spieler fertig sind.",
    );
  }
}

export async function getSessionMatchAnalysis(
  inviteCode: string,
  viewerPlayerId: string,
): Promise<MatchAnalysisResult & {
  inviteCode: string;
  leagueCode: string;
  roundNumber: number;
  finishedAt: string | null;
  viewerPlayerId: string;
  opponentPlayerId: string | null;
  viewerName: string;
  opponentName: string | null;
}> {
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

  if (session.players.length !== 2) {
    throw new MatchAnalysisNotSupportedError(
      "Spielanalyse ist derzeit nur für Zwei-Spieler-Runden verfügbar.",
    );
  }

  assertSessionAnalysisReady(session);

  const opponentPlayer = playersWithIds.find((p) => p.id !== viewerPlayer.id) ?? null;

  const runIds = session.players.map((p) => p.run.id);
  const analysisRuns = await Promise.all(runIds.map((id) => loadAnalysisRun(id)));
  if (analysisRuns.some((r) => !r)) {
    throw new MatchAnalysisNotReadyError("Spieldaten unvollständig.");
  }

  const viewerRun = analysisRuns.find((_, i) => session.players[i]!.id === viewerPlayer.id)!;
  const opponentRun = opponentPlayer
    ? analysisRuns.find((_, i) => session.players[i]!.id === opponentPlayer.id)!
    : null;

  const analysis = buildMatchAnalysis({
    mode: "multi",
    ready: true,
    viewerRun: viewerRun!,
    opponentRun,
    allRuns: analysisRuns as AnalysisRun[],
  });

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
    opponentPlayerId: opponentPlayer?.publicId ?? null,
    viewerName: viewerPlayer.name.startsWith("pid:")
      ? viewerPlayer.publicId
      : viewerPlayer.name,
    opponentName: opponentPlayer
      ? opponentPlayer.name.startsWith("pid:")
        ? opponentPlayer.publicId
        : opponentPlayer.name
      : null,
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
  if (!dbRun || dbRun.status !== "FINISHED") {
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
