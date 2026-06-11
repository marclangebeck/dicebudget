import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RUN_STATUS } from "../domain/fieldTypes.js";
import { prisma } from "../db/prisma.js";
import { createRun } from "./createRun.js";
import { getStats } from "./getStats.js";

describe("getStats", () => {
  it("aggregiert abgeschlossene Runs per DB-Aggregation", async () => {
    const { runId: runA } = await createRun(2, false);
    const { runId: runB } = await createRun(3, false);

    await prisma.run.update({
      where: { id: runA },
      data: { status: RUN_STATUS.FINISHED, totalScore: 120, finishedAt: new Date() },
    });
    await prisma.run.update({
      where: { id: runB },
      data: { status: RUN_STATUS.FINISHED, totalScore: 200, finishedAt: new Date() },
    });
    await prisma.game.updateMany({
      where: { runId: runA },
      data: { score: 60 },
    });
    await prisma.game.updateMany({
      where: { runId: runB },
      data: { score: 70 },
    });

    const stats = await getStats();

    assert.ok(stats.finishedRuns >= 2);
    assert.ok(stats.bestTotalScore !== null && stats.bestTotalScore >= 200);
    assert.ok(stats.bestGameScore !== null && stats.bestGameScore >= 70);
    assert.ok(stats.averageTotalScore !== null);
    assert.ok(stats.bestByGameCount.some((row) => row.gameCount === 2));
    assert.ok(stats.bestByGameCount.some((row) => row.gameCount === 3));
  });
});
