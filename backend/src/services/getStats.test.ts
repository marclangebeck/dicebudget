import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RUN_STATUS } from "../domain/fieldTypes.js";
import { prisma } from "../db/prisma.js";
import { createRun } from "./createRun.js";
import { getStats, getStatsGlobal } from "./getStats.js";

describe("getStats", () => {
  it("ohne playerId fail-closed leer", async () => {
    const stats = await getStats();
    assert.equal(stats.finishedRuns, 0);
    assert.equal(stats.bestTotalScore, null);
  });

  it("aggregiert abgeschlossene Runs global (Admin)", async () => {
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

    const stats = await getStatsGlobal();

    assert.ok(stats.finishedRuns >= 2);
    assert.ok(stats.bestTotalScore !== null && stats.bestTotalScore >= 200);
    assert.ok(stats.bestGameScore !== null && stats.bestGameScore >= 70);
    assert.ok(stats.averageTotalScore !== null);
    assert.ok(stats.bestByGameCount.some((row) => row.gameCount === 2));
    assert.ok(stats.bestByGameCount.some((row) => row.gameCount === 3));
  });
});
