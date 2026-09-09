import { ROLLS_PER_FIELD } from "../config.js";
import { poolDeltaForComplete } from "../domain/gameRules.js";
import { isValidRollSaleScore } from "../domain/houseRules.js";
import { assertExtraYatzyDieValue, appendExtraYatzyDieValue } from "../domain/extraYatzyDieValues.js";
import {
  EXTRA_YATZY_BONUS_POINTS,
  computeGameBreakdown,
  gameIndexForExtraYatzyClick,
} from "../domain/gameScoring.js";
import { assertValidScoreForField, InvalidFieldScoreError } from "../domain/fieldScores.js";
import { RUN_STATUS } from "../domain/fieldTypes.js";
import type { FieldTypeId } from "../domain/fieldTypes.js";
import { isValidYatzyEfficiencyScore } from "../domain/yatzyEfficiency.js";
import { prisma } from "../db/prisma.js";
import { getRunById } from "./getRun.js";
import { assertRunPlayerAccess } from "./runPlayerAuth.js";
import { maybeFinishSessionForRun } from "./sessionService.js";
import { backfillScoredSequences } from "./scoredSequence.js";

export class RunNotFoundError extends Error {
  constructor() {
    super("Run not found");
    this.name = "RunNotFoundError";
  }
}

export class RunNotActiveError extends Error {
  constructor() {
    super("Run is not active");
    this.name = "RunNotActiveError";
  }
}

export class FieldNotFoundError extends Error {
  constructor() {
    super("Field not found");
    this.name = "FieldNotFoundError";
  }
}

export class FieldAlreadyScoredError extends Error {
  constructor() {
    super("Field already scored");
    this.name = "FieldAlreadyScoredError";
  }
}

export class InvalidDiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDiceError";
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

export class RollLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RollLimitError";
  }
}

export class RunNotCompleteError extends Error {
  constructor() {
    super("Not all fields are scored");
    this.name = "RunNotCompleteError";
  }
}

export class FieldNotScoredError extends Error {
  constructor() {
    super("Field is not scored");
    this.name = "FieldNotScoredError";
  }
}

export class InvalidYatzyDieValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidYatzyDieValueError";
  }
}

export class NotLastScoredFieldError extends Error {
  constructor() {
    super("Only the last scored field can be cleared");
    this.name = "NotLastScoredFieldError";
  }
}

async function getLastScoredFieldForRun(
  runId: string,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0] | typeof prisma = prisma,
) {
  return tx.field.findFirst({
    where: {
      game: { runId },
      score: { not: null },
      scoredSequence: { not: null },
    },
    orderBy: { scoredSequence: "desc" },
  });
}

async function loadFieldForRun(runId: string, fieldId: string) {
  const field = await prisma.field.findFirst({
    where: { id: fieldId, game: { runId } },
    include: {
      rolls: { orderBy: { rollNumber: "asc" } },
      game: { include: { run: true } },
    },
  });
  return field;
}

async function recalculateRunTotals(runId: string, tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const games = await tx.game.findMany({
    where: { runId },
    include: { fields: true },
  });

  const breakdowns = games.map((game) => ({
    id: game.id,
    gameTotal: computeGameBreakdown(game.fields, game.extraYatzyBonus).gameTotal,
  }));
  const totalScore = breakdowns.reduce((sum, row) => sum + row.gameTotal, 0);

  await Promise.all(
    breakdowns.map((row) =>
      tx.game.update({
        where: { id: row.id },
        data: { score: row.gameTotal },
      }),
    ),
  );

  await tx.run.update({
    where: { id: runId },
    data: { totalScore },
  });
}

function assertManualEntry(
  score: number,
  rollsUsed: number,
  useStrategyRules: boolean,
): void {
  if (!Number.isInteger(score) || score < 0 || score > 999) {
    throw new InvalidInputError("score must be an integer from 0 to 999");
  }
  if (!Number.isInteger(rollsUsed) || rollsUsed < 1) {
    throw new InvalidInputError("rollsUsed must be a positive integer");
  }
  if (!useStrategyRules && rollsUsed > ROLLS_PER_FIELD) {
    throw new InvalidInputError(
      `rollsUsed must be an integer from 1 to ${ROLLS_PER_FIELD}`,
    );
  }
}

/** Wurf zu einem offenen Feld hinzufügen (optional, API). */
export async function recordRoll(
  runId: string,
  fieldId: string,
  diceValues: number[],
  playerSecret?: string,
) {
  await assertRunPlayerAccess(runId, playerSecret);
  const field = await loadFieldForRun(runId, fieldId);
  if (!field) throw new FieldNotFoundError();
  if (field.game.run.status !== RUN_STATUS.ACTIVE) throw new RunNotActiveError();
  if (field.score !== null) throw new FieldAlreadyScoredError();

  if (diceValues.length !== 5 || diceValues.some((d) => !Number.isInteger(d) || d < 1 || d > 6)) {
    throw new InvalidDiceError("diceValues must be five integers between 1 and 6");
  }

  const rollCount = field.rolls.length;
  const run = field.game.run;

  if (!run.useStrategyRules) {
    if (rollCount >= ROLLS_PER_FIELD) {
      throw new RollLimitError(`At most ${ROLLS_PER_FIELD} rolls per field in classic mode`);
    }
  }
  // Strategy: Extra-Würfe nur aus dem Pool — kein globales Restbudget-Cap.

  const rollNumber = rollCount + 1;
  const usePoolRoll = run.useStrategyRules && rollCount >= ROLLS_PER_FIELD;

  await prisma.$transaction(async (tx) => {
    if (usePoolRoll) {
      const current = await tx.run.findUniqueOrThrow({ where: { id: runId } });
      if (current.rollsInPool < 1) {
        throw new RollLimitError("No rolls left in pool for extra roll on this field");
      }
      await tx.run.update({
        where: { id: runId },
        data: { rollsInPool: { decrement: 1 } },
      });
    }

    await tx.roll.create({
      data: {
        fieldId,
        rollNumber,
        diceValues: JSON.stringify(diceValues),
      },
    });
    await tx.run.update({
      where: { id: runId },
      data: { totalRollsUsed: { increment: 1 } },
    });
  });

  return getRunById(runId);
}

/**
 * Feld manuell eintragen: Punkte + Anzahl Würfe.
 * Bis 3 Würfe: Rest geht in den Pool. Mehr als 3: verbraucht Pool.
 */
/** Zusatz-Yatzy (ab 7.): +100 auf Ergebnis Spiel der nächsten Spalte (Sp1, Sp2, … rotierend). */
export async function incrementExtraYatzy(
  runId: string,
  yatzyDieValue: number,
  playerSecret?: string,
) {
  assertExtraYatzyDieValue(yatzyDieValue);
  await assertRunPlayerAccess(runId, playerSecret);

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { games: { orderBy: { index: "asc" } } },
  });
  if (!run) throw new RunNotFoundError();
  if (run.status !== RUN_STATUS.ACTIVE) throw new RunNotActiveError();

  const nextCount = run.extraYatzyCount + 1;
  const targetIndex = gameIndexForExtraYatzyClick(nextCount, run.gameCount);
  const targetGame = run.games.find((g) => g.index === targetIndex);
  if (!targetGame) throw new Error("Game not found for extra Alle Fünfe bonus");

  await prisma.$transaction(async (tx) => {
    await tx.run.update({
      where: { id: runId },
      data: { extraYatzyCount: nextCount },
    });
    await tx.game.update({
      where: { id: targetGame.id },
      data: {
        extraYatzyBonus: { increment: EXTRA_YATZY_BONUS_POINTS },
        extraYatzyDieValues: appendExtraYatzyDieValue(
          targetGame.extraYatzyDieValues,
          yatzyDieValue,
        ),
      },
    });
    await recalculateRunTotals(runId, tx);
  });

  return getRunById(runId);
}

function assertYatzyDieValue(
  fieldType: string,
  score: number,
  yatzyDieValue: number | undefined,
): number | null {
  const isKniffelHit = fieldType === "KNIFFEL" && score > 0;
  if (!isKniffelHit) {
    if (yatzyDieValue !== undefined && yatzyDieValue !== null) {
      throw new InvalidYatzyDieValueError(
        "yatzyDieValue is only allowed for a scored Alle Fünfe (Treffer)",
      );
    }
    return null;
  }
  if (
    yatzyDieValue === undefined ||
    !Number.isInteger(yatzyDieValue) ||
    yatzyDieValue < 1 ||
    yatzyDieValue > 6
  ) {
    throw new InvalidYatzyDieValueError(
      "yatzyDieValue must be an integer from 1 to 6 for Alle Fünfe",
    );
  }
  return yatzyDieValue;
}

async function sessionYatzyEfficiencyEnabled(runId: string): Promise<boolean> {
  const player = await prisma.player.findUnique({
    where: { runId },
    select: {
      session: {
        select: { useStrategyRules: true, ruleYatzyEfficiency: true },
      },
    },
  });
  return Boolean(
    player?.session?.useStrategyRules && player.session.ruleYatzyEfficiency,
  );
}

export async function completeField(
  runId: string,
  fieldId: string,
  input: { score: number; rollsUsed: number; yatzyDieValue?: number },
  playerSecret?: string,
) {
  const [, field] = await Promise.all([
    assertRunPlayerAccess(runId, playerSecret),
    loadFieldForRun(runId, fieldId),
  ]);
  if (!field) throw new FieldNotFoundError();
  const { score, rollsUsed, yatzyDieValue } = input;
  const run = field.game.run;
  const isCorrection = field.score !== null;
  const isRollSaleEntry = run.rollSaleFreeFillActive && !isCorrection;
  const needsAutoHouseRules = run.useStrategyRules && !isCorrection;

  const runBeforeAuto = needsAutoHouseRules
    ? await prisma.run.findUnique({
        where: { id: runId },
        include: {
          games: {
            orderBy: { index: "asc" },
            include: { fields: true },
          },
        },
      })
    : null;
  if (needsAutoHouseRules && !runBeforeAuto) throw new RunNotFoundError();

  if (isRollSaleEntry) {
    if (!run.useStrategyRules) {
      throw new InvalidInputError("Verkaufs-Freifeld nur im Strategy-Modus");
    }
    if (rollsUsed !== 0) {
      throw new InvalidInputError("Verkaufs-Freifeld: 0 Würfe (ohne Würfeln)");
    }
    if (!isValidRollSaleScore(field.fieldType as FieldTypeId, score)) {
      throw new InvalidFieldScoreError(field.fieldType as FieldTypeId, score);
    }
    if (yatzyDieValue !== undefined && yatzyDieValue !== null) {
      throw new InvalidYatzyDieValueError("yatzyDieValue nicht erlaubt beim Verkaufs-Freifeld");
    }
    if (run.status !== RUN_STATUS.ACTIVE) throw new RunNotActiveError();

    await prisma.$transaction(async (tx) => {
      const runRow = await tx.run.findUniqueOrThrow({ where: { id: runId } });
      const scoredSequence = runRow.nextScoredSequence;
      await tx.run.update({
        where: { id: runId },
        data: {
          nextScoredSequence: { increment: 1 },
          rollSaleFreeFillActive: false,
        },
      });
      await tx.field.update({
        where: { id: fieldId },
        data: { score, rollsUsed: 0, scoredSequence, yatzyDieValue: null },
      });
      await recalculateRunTotals(runId, tx);
    });

    let events: import("./houseRulesService.js").HouseRuleAutoEvent[] = [];
    if (runBeforeAuto) {
      const { applyAutoHouseRulesAfterComplete } = await import("./houseRulesService.js");
      events = (await applyAutoHouseRulesAfterComplete(runId, runBeforeAuto)).events;
    }
    return { run: await getRunById(runId, { includeRolls: false }), events };
  }

  assertManualEntry(score, rollsUsed, run.useStrategyRules);
  const efficiencyOn =
    field.fieldType === "KNIFFEL" &&
    run.useStrategyRules &&
    (await sessionYatzyEfficiencyEnabled(runId));
  if (efficiencyOn) {
    if (!isValidYatzyEfficiencyScore(score, rollsUsed)) {
      throw new InvalidFieldScoreError(field.fieldType as FieldTypeId, score);
    }
  } else {
    assertValidScoreForField(field.fieldType, score);
  }
  const resolvedYatzyDie = assertYatzyDieValue(field.fieldType, score, yatzyDieValue);
  if (run.status !== RUN_STATUS.ACTIVE) throw new RunNotActiveError();

  const oldRollsUsed = isCorrection ? field.rollsUsed : 0;
  const oldDelta = isCorrection
    ? poolDeltaForComplete(oldRollsUsed, run.useStrategyRules)
    : { spareToPool: 0, poolCost: 0 };
  const newDelta = poolDeltaForComplete(rollsUsed, run.useStrategyRules);

  // Strategy: nur Pool begrenzt Extra-Würfe — kein globales Restbudget-Cap.
  if (run.useStrategyRules) {
    const poolAfterUndo = run.rollsInPool - oldDelta.spareToPool + oldDelta.poolCost;
    if (newDelta.poolCost > poolAfterUndo) {
      throw new RollLimitError(
        `Nicht genug Würfe im Pool (benötigt ${newDelta.poolCost}, vorhanden ${poolAfterUndo})`,
      );
    }
  }

  const rollsIncrement = run.useStrategyRules ? rollsUsed - oldRollsUsed : 0;
  const poolIncrement =
    newDelta.spareToPool -
    newDelta.poolCost -
    (oldDelta.spareToPool - oldDelta.poolCost);

  await prisma.$transaction(async (tx) => {
    const runRow = await tx.run.findUniqueOrThrow({ where: { id: runId } });
    const scoredSequence = isCorrection ? field.scoredSequence : runRow.nextScoredSequence;

    if (!isCorrection) {
      await tx.run.update({
        where: { id: runId },
        data: { nextScoredSequence: { increment: 1 } },
      });
    }

    await tx.field.update({
      where: { id: fieldId },
      data: { score, rollsUsed, scoredSequence, yatzyDieValue: resolvedYatzyDie },
    });
    await tx.run.update({
      where: { id: runId },
      data: {
        totalRollsUsed: run.useStrategyRules
          ? { increment: rollsIncrement }
          : { increment: 0 },
        rollsInPool: run.useStrategyRules
          ? { increment: poolIncrement }
          : { increment: 0 },
      },
    });
    await recalculateRunTotals(runId, tx);
  });

  let events: import("./houseRulesService.js").HouseRuleAutoEvent[] = [];
  if (runBeforeAuto) {
    const { applyAutoHouseRulesAfterComplete } = await import("./houseRulesService.js");
    events = (await applyAutoHouseRulesAfterComplete(runId, runBeforeAuto)).events;
  }

  return { run: await getRunById(runId, { includeRolls: false }), events };
}

/** Letzten Eintrag vollständig löschen (nur das zuletzt bewertete Feld). */
export async function clearLastField(
  runId: string,
  fieldId: string,
  playerSecret?: string,
) {
  await assertRunPlayerAccess(runId, playerSecret);
  const field = await loadFieldForRun(runId, fieldId);
  if (!field) throw new FieldNotFoundError();
  const run = field.game.run;
  if (run.status !== RUN_STATUS.ACTIVE) throw new RunNotActiveError();
  if (field.score === null) throw new FieldNotScoredError();

  await backfillScoredSequences(runId);

  const lastField = await getLastScoredFieldForRun(runId);
  if (!lastField || lastField.id !== fieldId) throw new NotLastScoredFieldError();

  const oldRollsUsed = field.rollsUsed;
  const oldDelta = poolDeltaForComplete(oldRollsUsed, run.useStrategyRules);
  const poolIncrement = oldDelta.poolCost - oldDelta.spareToPool;

  await prisma.$transaction(async (tx) => {
    await tx.roll.deleteMany({ where: { fieldId } });
    await tx.field.update({
      where: { id: fieldId },
      data: { score: null, rollsUsed: 0, scoredSequence: null, yatzyDieValue: null },
    });
    await tx.run.update({
      where: { id: runId },
      data: {
        totalRollsUsed: run.useStrategyRules ? { decrement: oldRollsUsed } : { increment: 0 },
        rollsInPool: run.useStrategyRules ? { increment: poolIncrement } : { increment: 0 },
      },
    });
    await recalculateRunTotals(runId, tx);
  });

  return getRunById(runId);
}

/** Run vorzeitig beenden (offene Felder bleiben leer); nur der eigene Lauf. */
export async function abandonRun(runId: string, playerSecret?: string) {
  await assertRunPlayerAccess(runId, playerSecret);
  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) throw new RunNotFoundError();
  if (run.status !== RUN_STATUS.ACTIVE) throw new RunNotActiveError();

  await prisma.$transaction(async (tx) => {
    await recalculateRunTotals(runId, tx);
    await tx.run.update({
      where: { id: runId },
      data: { status: RUN_STATUS.ABANDONED, finishedAt: new Date() },
    });
  });

  await maybeFinishSessionForRun(runId);

  return getRunById(runId);
}

/** Run abschließen, wenn alle Felder bewertet sind. */
export async function finishRun(runId: string, playerSecret?: string) {
  await assertRunPlayerAccess(runId, playerSecret);
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { games: { include: { fields: true } } },
  });
  if (!run) throw new RunNotFoundError();
  if (run.status !== RUN_STATUS.ACTIVE) throw new RunNotActiveError();

  const openFields = run.games.flatMap((g) => g.fields).filter((f) => f.score === null);
  if (openFields.length > 0) throw new RunNotCompleteError();

  await prisma.run.update({
    where: { id: runId },
    data: { status: RUN_STATUS.FINISHED, finishedAt: new Date() },
  });

  await maybeFinishSessionForRun(runId);

  return getRunById(runId);
}
