import type { Prisma } from "@prisma/client";
import {
  FIELDS_PER_GAME,
  MAX_GAME_COUNT,
  MIN_GAME_COUNT,
  fieldCountForGameCount,
  maxRollsForGameCount,
} from "../config.js";
import { FIELD_TYPES_PER_GAME } from "../domain/fieldTypes.js";
import { prisma } from "../db/prisma.js";

export class InvalidGameCountError extends Error {
  constructor(gameCount: number) {
    super(`game_count must be between ${MIN_GAME_COUNT} and ${MAX_GAME_COUNT}, got ${gameCount}`);
    this.name = "InvalidGameCountError";
  }
}

export function assertValidGameCount(gameCount: number): void {
  if (!Number.isInteger(gameCount) || gameCount < MIN_GAME_COUNT || gameCount > MAX_GAME_COUNT) {
    throw new InvalidGameCountError(gameCount);
  }
}

export function parseUseStrategyRules(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  return Boolean(value);
}

export type CreateRunResult = {
  runId: string;
  gameCount: number;
  useStrategyRules: boolean;
  fieldCount: number;
  maxRolls: number | null;
};

/**
 * Neuen Run inkl. Spielen und Feldern anlegen (in Transaktion verwendbar).
 */
export async function instantiateRun(
  tx: Prisma.TransactionClient,
  gameCount: number,
  useStrategyRules = true,
): Promise<{ id: string }> {
  assertValidGameCount(gameCount);

  const created = await tx.run.create({
    data: { gameCount, useStrategyRules },
  });

  for (let gameIndex = 1; gameIndex <= gameCount; gameIndex += 1) {
    const game = await tx.game.create({
      data: {
        runId: created.id,
        index: gameIndex,
      },
    });

    for (const fieldType of FIELD_TYPES_PER_GAME) {
      await tx.field.create({
        data: {
          gameId: game.id,
          fieldType,
        },
      });
    }
  }

  return created;
}

/**
 * Legt einen Singleplayer-Run an: `game_count` Spiele × 13 Felder.
 */
export async function createRun(
  gameCount: number,
  useStrategyRules = true,
): Promise<CreateRunResult> {
  assertValidGameCount(gameCount);

  const run = await prisma.$transaction(async (tx) =>
    instantiateRun(tx, gameCount, useStrategyRules),
  );

  return {
    runId: run.id,
    gameCount,
    useStrategyRules,
    fieldCount: fieldCountForGameCount(gameCount),
    maxRolls: useStrategyRules ? maxRollsForGameCount(gameCount) : null,
  };
}

/** Prüft, ob ein Run die erwartete Struktur hat (für Tests/Skripte). */
export async function getRunSummary(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      games: {
        include: { _count: { select: { fields: true } } },
        orderBy: { index: "asc" },
      },
    },
  });

  if (!run) return null;

  const fieldCount = run.games.reduce((sum, g) => sum + g._count.fields, 0);

  return {
    runId: run.id,
    gameCount: run.gameCount,
    useStrategyRules: run.useStrategyRules,
    games: run.games.length,
    fields: fieldCount,
    expectedFields: fieldCountForGameCount(run.gameCount),
    maxRolls: run.useStrategyRules ? maxRollsForGameCount(run.gameCount) : null,
    fieldsPerGame: FIELDS_PER_GAME,
  };
}
