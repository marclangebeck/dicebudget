import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { prisma } from "../db/prisma.js";
import { createRun } from "./createRun.js";
import {
  ForbiddenRunError,
  assertRunPlayerAccess,
} from "./runPlayerAuth.js";

describe("assertRunPlayerAccess solo secret", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("requires soloSecretToken for API-created runs", async () => {
    const { runId, soloSecretToken } = await createRun(1, false);
    try {
      await assert.rejects(
        () => assertRunPlayerAccess(runId, undefined),
        (err: unknown) => err instanceof ForbiddenRunError,
      );
      await assert.rejects(
        () => assertRunPlayerAccess(runId, "wrong-token"),
        (err: unknown) => err instanceof ForbiddenRunError,
      );
      await assertRunPlayerAccess(runId, soloSecretToken);
    } finally {
      await prisma.run.delete({ where: { id: runId } });
    }
  });

  it("allows legacy runs without solo secret", async () => {
    const run = await prisma.run.create({
      data: { gameCount: 1, useStrategyRules: false, soloSecretToken: null },
    });
    try {
      await assertRunPlayerAccess(run.id, undefined);
    } finally {
      await prisma.run.delete({ where: { id: run.id } });
    }
  });
});
