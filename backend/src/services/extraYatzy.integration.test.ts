import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { prisma } from "../db/prisma.js";
import { createRun } from "./createRun.js";
import { incrementExtraYatzy } from "./playField.js";

async function deleteRun(runId: string): Promise<void> {
  await prisma.run.delete({ where: { id: runId } });
}

describe("incrementExtraYatzy (integration)", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("adds 100 to rotating game columns", async () => {
    const { runId } = await createRun(3, false);
    try {
      const r1 = await incrementExtraYatzy(runId, 3);
      assert.equal(r1.extraYatzyCount, 1);
      assert.equal(r1.games[0]!.summary.extraYatzyBonus, 100);
      assert.equal(r1.games[0]!.summary.gameTotal, 100);
      assert.deepEqual(r1.games[0]!.summary.extraYatzyDieValues, [3]);

      const r2 = await incrementExtraYatzy(runId, 5);
      assert.equal(r2.extraYatzyCount, 2);
      assert.equal(r2.games[1]!.summary.extraYatzyBonus, 100);
      assert.deepEqual(r2.games[1]!.summary.extraYatzyDieValues, [5]);

      await incrementExtraYatzy(runId, 1);
      await incrementExtraYatzy(runId, 2);
      const r5 = await incrementExtraYatzy(runId, 4);
      assert.equal(r5.extraYatzyCount, 5);
      assert.equal(r5.games[0]!.summary.extraYatzyBonus, 200);
      assert.equal(r5.games[1]!.summary.extraYatzyBonus, 200);
      assert.equal(r5.games[2]!.summary.extraYatzyBonus, 100);
      assert.deepEqual(r5.games[0]!.summary.extraYatzyDieValues, [3, 2]);
      assert.deepEqual(r5.games[1]!.summary.extraYatzyDieValues, [5, 4]);
      assert.deepEqual(r5.games[2]!.summary.extraYatzyDieValues, [1]);
    } finally {
      await deleteRun(runId);
    }
  });
});
