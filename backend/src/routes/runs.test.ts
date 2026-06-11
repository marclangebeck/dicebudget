import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { prisma } from "../db/prisma.js";
import { createRun } from "../services/createRun.js";
import { createTestApp, request } from "../test/httpSetup.js";

async function deleteRun(runId: string): Promise<void> {
  await prisma.run.deleteMany({ where: { id: runId } });
}

describe("runs routes", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("GET /runs/:id returns 403 without valid solo secret", async () => {
    const { runId, soloSecretToken } = await createRun(1, false);
    try {
      const app = createTestApp();
      const res = await request(app).get(`/runs/${runId}`);
      assert.equal(res.status, 403);

      const ok = await request(app)
        .get(`/runs/${runId}`)
        .set("X-Player-Secret", soloSecretToken);
      assert.equal(ok.status, 200);
      assert.equal(ok.body.run.id, runId);
    } finally {
      await deleteRun(runId);
    }
  });

  it("GET /runs/:id returns 404 for unknown run", async () => {
    const app = createTestApp();
    const res = await request(app)
      .get("/runs/nonexistent-run-id")
      .set("X-Player-Secret", "any");
    assert.equal(res.status, 404);
  });

  it("POST /runs creates a solo run", async () => {
    const app = createTestApp();
    const res = await request(app).post("/runs").send({ gameCount: 2, useStrategyRules: true });
    assert.equal(res.status, 201);
    assert.ok(res.body.soloSecretToken);
    assert.equal(res.body.run.gameCount, 2);
    await deleteRun(res.body.run.id);
  });
});
