import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { InvalidFieldScoreError } from "../domain/fieldScores.js";
import { prisma } from "../db/prisma.js";
import { createRun } from "./createRun.js";
import { getRunById } from "./getRun.js";
import {
  InvalidInputError,
  NotLastScoredFieldError,
  RollLimitError,
  clearLastField,
  completeField,
} from "./playField.js";

async function fieldIdByType(
  runId: string,
  fieldType: string,
): Promise<string> {
  const field = await prisma.field.findFirst({
    where: { game: { runId }, fieldType },
  });
  if (!field) throw new Error(`no ${fieldType} field on run`);
  return field.id;
}

async function deleteRun(runId: string): Promise<void> {
  await prisma.run.delete({ where: { id: runId } });
}

describe("completeField (integration)", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("rejects scores that are not allowed for the field type", async () => {
    const { runId, soloSecretToken } = await createRun(1, false);
    try {
      const fieldId = await fieldIdByType(runId, "ONES");
      await assert.rejects(
        () =>
          completeField(runId, fieldId, { score: 7, rollsUsed: 1 }, soloSecretToken),
        (err: unknown) => err instanceof InvalidFieldScoreError,
      );
    } finally {
      await deleteRun(runId);
    }
  });

  it("accepts Alle-Fünfe efficiency hit (45 at 8 rolls) in strategy", async () => {
    const { runId, soloSecretToken } = await createRun(1, true);
    try {
      await prisma.run.update({ where: { id: runId }, data: { rollsInPool: 10 } });
      const fieldId = await fieldIdByType(runId, "KNIFFEL");
      await completeField(
        runId,
        fieldId,
        { score: 45, rollsUsed: 8, yatzyDieValue: 6 },
        soloSecretToken,
      );
      const field = await prisma.field.findUniqueOrThrow({ where: { id: fieldId } });
      assert.equal(field.score, 45);
      assert.equal(field.rollsUsed, 8);
    } finally {
      await deleteRun(runId);
    }
  });

  it("rejects Alle-Fünfe 45 in classic mode", async () => {
    const { runId, soloSecretToken } = await createRun(1, false);
    try {
      const fieldId = await fieldIdByType(runId, "KNIFFEL");
      await assert.rejects(
        () =>
          completeField(
            runId,
            fieldId,
            { score: 45, rollsUsed: 1, yatzyDieValue: 6 },
            soloSecretToken,
          ),
        (err: unknown) => err instanceof InvalidFieldScoreError,
      );
    } finally {
      await deleteRun(runId);
    }
  });

  it("rejects more than three rolls in classic mode", async () => {
    const { runId, soloSecretToken } = await createRun(1, false);
    try {
      const fieldId = await fieldIdByType(runId, "ONES");
      await assert.rejects(
        () =>
          completeField(runId, fieldId, { score: 3, rollsUsed: 4 }, soloSecretToken),
        (err: unknown) => err instanceof InvalidInputError,
      );
    } finally {
      await deleteRun(runId);
    }
  });

  it("stores rollsUsed 1 for a valid classic entry", async () => {
    const { runId, soloSecretToken } = await createRun(1, false);
    try {
      const fieldId = await fieldIdByType(runId, "ONES");
      await completeField(runId, fieldId, { score: 4, rollsUsed: 1 }, soloSecretToken);
      const field = await prisma.field.findUniqueOrThrow({ where: { id: fieldId } });
      assert.equal(field.score, 4);
      assert.equal(field.rollsUsed, 1);
    } finally {
      await deleteRun(runId);
    }
  });

  it("rejects pool use when not enough rolls are in the pool", async () => {
    const { runId, soloSecretToken } = await createRun(1, true);
    try {
      const fieldId = await fieldIdByType(runId, "ONES");
      await assert.rejects(
        () =>
          completeField(runId, fieldId, { score: 5, rollsUsed: 5 }, soloSecretToken),
        (err: unknown) => err instanceof RollLimitError,
      );
    } finally {
      await deleteRun(runId);
    }
  });

  it("applies pool spare and cost in strategy mode", async () => {
    const { runId, soloSecretToken } = await createRun(1, true);
    try {
      const fieldId = await fieldIdByType(runId, "ONES");
      await completeField(runId, fieldId, { score: 2, rollsUsed: 1 }, soloSecretToken);
      const run = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
      assert.equal(run.rollsInPool, 2);
      assert.equal(run.totalRollsUsed, 1);
    } finally {
      await deleteRun(runId);
    }
  });

  it("updates an already scored field and adjusts roll pool", async () => {
    const { runId, soloSecretToken } = await createRun(1, true);
    try {
      const fieldId = await fieldIdByType(runId, "ONES");
      await completeField(runId, fieldId, { score: 2, rollsUsed: 1 }, soloSecretToken);
      await completeField(runId, fieldId, { score: 5, rollsUsed: 2 }, soloSecretToken);
      const field = await prisma.field.findUniqueOrThrow({ where: { id: fieldId } });
      const run = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
      assert.equal(field.score, 5);
      assert.equal(field.rollsUsed, 2);
      assert.equal(run.totalRollsUsed, 2);
      assert.equal(run.rollsInPool, 1);
    } finally {
      await deleteRun(runId);
    }
  });

  it("clears only the last scored field and restores pool rolls", async () => {
    const { runId, soloSecretToken } = await createRun(1, true);
    try {
      const onesId = await fieldIdByType(runId, "ONES");
      const twosId = await fieldIdByType(runId, "TWOS");
      await completeField(runId, onesId, { score: 2, rollsUsed: 1 }, soloSecretToken);
      await completeField(runId, twosId, { score: 4, rollsUsed: 2 }, soloSecretToken);

      await assert.rejects(
        () => clearLastField(runId, onesId, soloSecretToken),
        (err: unknown) => err instanceof NotLastScoredFieldError,
      );

      const cleared = await clearLastField(runId, twosId, soloSecretToken);
      assert.equal(cleared?.lastScoredFieldId, onesId);
      const twos = await prisma.field.findUniqueOrThrow({ where: { id: twosId } });
      const run = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
      assert.equal(twos.score, null);
      assert.equal(twos.rollsUsed, 0);
      assert.equal(run.totalRollsUsed, 1);
      assert.equal(run.rollsInPool, 2);
    } finally {
      await deleteRun(runId);
    }
  });

  it("backfills legacy scored fields so the last entry can be cleared", async () => {
    const { runId, soloSecretToken } = await createRun(1, false);
    try {
      const fieldId = await fieldIdByType(runId, "ONES");
      await prisma.field.update({
        where: { id: fieldId },
        data: { score: 3, rollsUsed: 1 },
      });
      await prisma.run.update({
        where: { id: runId },
        data: { totalScore: 3 },
      });

      const run = await getRunById(runId);
      assert.equal(run?.lastScoredFieldId, fieldId);

      const cleared = await clearLastField(runId, fieldId, soloSecretToken);
      assert.equal(cleared?.games[0]?.fields[0]?.score, null);
    } finally {
      await deleteRun(runId);
    }
  });
});
