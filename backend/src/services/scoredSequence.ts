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

  if (!run) return;

  const allFields = run.games.flatMap((game) => sortFields(game.fields));
  const needsBackfill = allFields.some((f) => f.score !== null && f.scoredSequence === null);
  if (!needsBackfill) return;

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

export function findLastScoredFieldId(
  games: Array<{ fields: Array<{ id: string; score: number | null; scoredSequence: number | null }> }>,
): string | null {
  const lastScoredField = games
    .flatMap((game) => game.fields)
    .filter((field) => field.score !== null && field.scoredSequence !== null)
    .sort((a, b) => (b.scoredSequence ?? 0) - (a.scoredSequence ?? 0))[0];

  return lastScoredField?.id ?? null;
}
