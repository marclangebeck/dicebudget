import { maxRollsForGameCount } from "../config.js";
import { parseExtraYatzyDieValues } from "../domain/extraYatzyDieValues.js";
import { computeGameBreakdown } from "../domain/gameScoring.js";
import { sortFields } from "../domain/fieldTypes.js";
import { prisma } from "../db/prisma.js";
import { findLastScoredFieldId } from "./scoredSequence.js";

type GetRunOptions = {
  /** Default true. Nach Feldeintrag oft unnötig (weniger Joins/JSON). */
  includeRolls?: boolean;
};

function buildRunInclude(includeRolls: boolean) {
  return {
    games: {
      orderBy: { index: "asc" as const },
      include: {
        fields: {
          orderBy: { fieldType: "asc" as const },
          ...(includeRolls
            ? {
                include: {
                  rolls: { orderBy: { rollNumber: "asc" as const } },
                },
              }
            : {}),
        },
      },
    },
  };
}

export async function getRunById(runId: string, options?: GetRunOptions) {
  const includeRolls = options?.includeRolls !== false;
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: buildRunInclude(includeRolls),
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
    rollSaleFreeFillActive: run.rollSaleFreeFillActive,
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
        fields: sortedFields.map((field) => {
          const rolls =
            includeRolls && "rolls" in field && Array.isArray(field.rolls)
              ? field.rolls.map((roll: { id: string; rollNumber: number; diceValues: string }) => ({
                  id: roll.id,
                  rollNumber: roll.rollNumber,
                  diceValues: JSON.parse(roll.diceValues) as number[],
                }))
              : [];
          return {
            id: field.id,
            fieldType: field.fieldType,
            score: field.score,
            rollsUsed: field.rollsUsed,
            scoredSequence: field.scoredSequence,
            yatzyDieValue: field.yatzyDieValue,
            rolls,
          };
        }),
      };
    }),
  };
}
