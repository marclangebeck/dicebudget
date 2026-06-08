import { maxRollsForGameCount } from "../config.js";
import { parseExtraYatzyDieValues } from "../domain/extraYatzyDieValues.js";
import { computeGameBreakdown } from "../domain/gameScoring.js";
import { FIELD_TYPES_PER_GAME } from "../domain/fieldTypes.js";
import { prisma } from "../db/prisma.js";
import { backfillScoredSequences, findLastScoredFieldId } from "./scoredSequence.js";

const fieldOrder = new Map<string, number>(
  FIELD_TYPES_PER_GAME.map((type, index) => [type, index]),
);

function sortFields<T extends { fieldType: string }>(fields: T[]): T[] {
  return [...fields].sort(
    (a, b) =>
      (fieldOrder.get(a.fieldType) ?? 0) - (fieldOrder.get(b.fieldType) ?? 0),
  );
}

export async function getRunById(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      games: {
        orderBy: { index: "asc" },
        include: {
          fields: {
            orderBy: { fieldType: "asc" },
            include: {
              rolls: { orderBy: { rollNumber: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!run) return null;

  await backfillScoredSequences(runId);

  const refreshed = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      games: {
        orderBy: { index: "asc" },
        include: {
          fields: {
            orderBy: { fieldType: "asc" },
            include: {
              rolls: { orderBy: { rollNumber: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!refreshed) return null;

  const maxRolls = refreshed.useStrategyRules ? maxRollsForGameCount(refreshed.gameCount) : null;
  const lastScoredFieldId = findLastScoredFieldId(refreshed.games);

  return {
    id: refreshed.id,
    gameCount: refreshed.gameCount,
    useStrategyRules: refreshed.useStrategyRules,
    totalScore: refreshed.totalScore,
    totalRollsUsed: refreshed.totalRollsUsed,
    extraYatzyCount: refreshed.extraYatzyCount,
    rollsInPool: refreshed.useStrategyRules ? refreshed.rollsInPool : 0,
    rollsRemaining:
      maxRolls !== null ? maxRolls - refreshed.totalRollsUsed : null,
    status: refreshed.status,
    createdAt: refreshed.createdAt.toISOString(),
    finishedAt: refreshed.finishedAt?.toISOString() ?? null,
    lastScoredFieldId,
    games: refreshed.games.map((game) => {
      const sortedFields = sortFields(game.fields);
      const summary = computeGameBreakdown(sortedFields, game.extraYatzyBonus);
      return {
        id: game.id,
        index: game.index,
        score: game.score,
        summary: {
          ...summary,
          extraYatzyDieValues: parseExtraYatzyDieValues(game.extraYatzyDieValues),
        },
        fields: sortedFields.map((field) => ({
          id: field.id,
          fieldType: field.fieldType,
          score: field.score,
          rollsUsed: field.rollsUsed,
          scoredSequence: field.scoredSequence,
          yatzyDieValue: field.yatzyDieValue,
          rolls: field.rolls.map((roll) => ({
            id: roll.id,
            rollNumber: roll.rollNumber,
            diceValues: JSON.parse(roll.diceValues) as number[],
          })),
        })),
      };
    }),
  };
}
