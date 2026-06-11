import { maxRollsForGameCount } from "../config.js";
import { parseExtraYatzyDieValues } from "../domain/extraYatzyDieValues.js";
import { computeGameBreakdown } from "../domain/gameScoring.js";
import { FIELD_TYPES_PER_GAME } from "../domain/fieldTypes.js";
import { prisma } from "../db/prisma.js";
import { findLastScoredFieldId } from "./scoredSequence.js";

const fieldOrder = new Map<string, number>(
  FIELD_TYPES_PER_GAME.map((type, index) => [type, index]),
);

function sortFields<T extends { fieldType: string }>(fields: T[]): T[] {
  return [...fields].sort(
    (a, b) =>
      (fieldOrder.get(a.fieldType) ?? 0) - (fieldOrder.get(b.fieldType) ?? 0),
  );
}

const runInclude = {
  games: {
    orderBy: { index: "asc" as const },
    include: {
      fields: {
        orderBy: { fieldType: "asc" as const },
        include: {
          rolls: { orderBy: { rollNumber: "asc" as const } },
        },
      },
    },
  },
};

export async function getRunById(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: runInclude,
  });

  if (!run) return null;

  const maxRolls = run.useStrategyRules ? maxRollsForGameCount(run.gameCount) : null;
  const lastScoredFieldId = findLastScoredFieldId(run.games);

  return {
    id: run.id,
    gameCount: run.gameCount,
    useStrategyRules: run.useStrategyRules,
    totalScore: run.totalScore,
    totalRollsUsed: run.totalRollsUsed,
    extraYatzyCount: run.extraYatzyCount,
    rollsInPool: run.useStrategyRules ? run.rollsInPool : 0,
    rollsRemaining:
      maxRolls !== null ? maxRolls - run.totalRollsUsed : null,
    status: run.status,
    createdAt: run.createdAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    lastScoredFieldId,
    games: run.games.map((game) => {
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
