import { FIELD_TYPES_PER_GAME } from "../domain/fieldTypes.js";
import { prisma } from "../db/prisma.js";

const fieldOrder = new Map<string, number>(
  FIELD_TYPES_PER_GAME.map((type, index) => [type, index]),
);

function sortFields<T extends { fieldType: string }>(fields: T[]): T[] {
  return [...fields].sort(
    (a, b) =>
      (fieldOrder.get(a.fieldType) ?? 0) - (fieldOrder.get(b.fieldType) ?? 0),
  );
}

type ScoredFieldRef = {
  id: string;
  score: number | null;
  scoredSequence: number | null;
};

/** True, wenn mindestens ein bewertetes Feld ohne scoredSequence existiert. */
export function runNeedsScoredSequenceBackfill(
  games: Array<{ fields: ScoredFieldRef[] }>,
): boolean {
  return games
    .flatMap((game) => game.fields)
    .some((field) => field.score !== null && field.scoredSequence === null);
}

/** Run-IDs mit fehlenden scoredSequence-Werten (für einmaliges Backfill-Skript). */
export async function listRunIdsNeedingScoredSequenceBackfill(): Promise<string[]> {
  const fields = await prisma.field.findMany({
    where: { score: { not: null }, scoredSequence: null },
    select: { game: { select: { runId: true } } },
  });
  return [...new Set(fields.map((field) => field.game.runId))];
}

/** Vergibt fehlende scoredSequence-Werte für ältere oder fortgesetzte Läufe. */
export async function backfillScoredSequences(runId: string): Promise<void> {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      games: {
        orderBy: { index: "asc" },
        include: { fields: true },
      },
    },
  });

  if (!run || !runNeedsScoredSequenceBackfill(run.games)) return;

  const allFields = run.games.flatMap((game) => sortFields(game.fields));
  let nextSeq =
    allFields.reduce(
      (max, field) =>
        field.scoredSequence !== null ? Math.max(max, field.scoredSequence + 1) : max,
      run.nextScoredSequence,
    ) || 1;

  const updates: { id: string; scoredSequence: number }[] = [];
  for (const game of run.games) {
    for (const field of sortFields(game.fields)) {
      if (field.score !== null && field.scoredSequence === null) {
        updates.push({ id: field.id, scoredSequence: nextSeq });
        nextSeq += 1;
      }
    }
  }

  if (updates.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      await tx.field.update({
        where: { id: update.id },
        data: { scoredSequence: update.scoredSequence },
      });
    }
    await tx.run.update({
      where: { id: runId },
      data: { nextScoredSequence: nextSeq },
    });
  });
}

/** Einmaliger Backfill aller betroffenen Runs (M25 — nicht bei normalem Read). */
export async function backfillAllScoredSequences(): Promise<{ runsUpdated: number }> {
  const runIds = await listRunIdsNeedingScoredSequenceBackfill();
  for (const runId of runIds) {
    await backfillScoredSequences(runId);
  }
  return { runsUpdated: runIds.length };
}

type LastScoredFieldRef = {
  id: string;
  score: number | null;
  scoredSequence: number | null;
  fieldType: string;
};

export function findLastScoredFieldId(
  games: Array<{ index?: number; fields: LastScoredFieldRef[] }>,
): string | null {
  const withSequence = games
    .flatMap((game) => game.fields)
    .filter((field) => field.score !== null && field.scoredSequence !== null)
    .sort((a, b) => (b.scoredSequence ?? 0) - (a.scoredSequence ?? 0))[0];

  if (withSequence) return withSequence.id;

  const legacyScored = games.flatMap((game, gameIdx) =>
    sortFields(game.fields)
      .filter((field) => field.score !== null && field.scoredSequence === null)
      .map((field) => ({ field, gameOrder: game.index ?? gameIdx + 1 })),
  );

  if (legacyScored.length === 0) return null;
  if (legacyScored.length === 1) return legacyScored[0]!.field.id;

  const lastLegacy = legacyScored[legacyScored.length - 1]!;
  return lastLegacy.field.id;
}
