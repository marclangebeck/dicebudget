import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { prisma } from "../db/prisma.js";
import { createTestApp, request } from "../test/httpSetup.js";

const PLAYER_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const PLAYER_B = "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee";

async function cleanupSession(inviteCode: string): Promise<void> {
  const session = await prisma.gameSession.findUnique({ where: { inviteCode } });
  if (!session) return;
  await prisma.gameSession.delete({ where: { id: session.id } });
}

describe("sessions routes", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("POST /sessions creates a lobby", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/sessions")
      .send({ gameCount: 1, maxPlayers: 2, useStrategyRules: false });
    assert.equal(res.status, 201);
    assert.ok(res.body.session.inviteCode);
    await cleanupSession(res.body.session.inviteCode);
  });

  it("GET /sessions/invite/:code returns 404 for unknown code", async () => {
    const app = createTestApp();
    const res = await request(app).get("/sessions/invite/UNKNOWN99");
    assert.equal(res.status, 404);
  });

  it("POST join returns 409 when same playerId joins twice", async () => {
    const app = createTestApp();
    const created = await request(app)
      .post("/sessions")
      .send({ gameCount: 1, maxPlayers: 2, useStrategyRules: false });
    const inviteCode = created.body.session.inviteCode as string;
    try {
      const first = await request(app)
        .post(`/sessions/invite/${inviteCode}/join`)
        .send({ playerId: PLAYER_A });
      assert.equal(first.status, 201);

      const second = await request(app)
        .post(`/sessions/invite/${inviteCode}/join`)
        .send({ playerId: PLAYER_A });
      assert.equal(second.status, 409);
      assert.match(second.body.error ?? "", /bereits/i);
    } finally {
      await cleanupSession(inviteCode);
    }
  });

  it("multiplayer run GET returns 403 with wrong player secret", async () => {
    const app = createTestApp();
    const created = await request(app)
      .post("/sessions")
      .send({ gameCount: 1, maxPlayers: 2, useStrategyRules: false });
    const inviteCode = created.body.session.inviteCode as string;
    try {
      const joined = await request(app)
        .post(`/sessions/invite/${inviteCode}/join`)
        .send({ playerId: PLAYER_A });
      const runId = joined.body.player.runId as string;
      const secret = joined.body.player.secretToken as string;
      assert.ok(secret);

      const forbidden = await request(app).get(`/runs/${runId}`);
      assert.equal(forbidden.status, 403);

      const ok = await request(app)
        .get(`/runs/${runId}`)
        .set("X-Player-Secret", secret);
      assert.equal(ok.status, 200);

      await request(app)
        .post(`/sessions/invite/${inviteCode}/join`)
        .send({ playerId: PLAYER_B });
    } finally {
      await cleanupSession(inviteCode);
    }
  });

  it("GET match-analysis returns 403 without player secret on open session", async () => {
    const app = createTestApp();
    const created = await request(app)
      .post("/sessions")
      .send({ gameCount: 1, maxPlayers: 2, useStrategyRules: false });
    const inviteCode = created.body.session.inviteCode as string;
    try {
      await request(app)
        .post(`/sessions/invite/${inviteCode}/join`)
        .send({ playerId: PLAYER_A });
      await request(app)
        .post(`/sessions/invite/${inviteCode}/join`)
        .send({ playerId: PLAYER_B });

      const res = await request(app).get(
        `/sessions/invite/${inviteCode}/match-analysis?viewerPlayerId=${PLAYER_A}`,
      );
      assert.equal(res.status, 403);
    } finally {
      await cleanupSession(inviteCode);
    }
  });

  it("GET match-analysis accepts valid secret before session is finished", async () => {
    const app = createTestApp();
    const created = await request(app)
      .post("/sessions")
      .send({ gameCount: 1, maxPlayers: 2, useStrategyRules: false });
    const inviteCode = created.body.session.inviteCode as string;
    try {
      const joined = await request(app)
        .post(`/sessions/invite/${inviteCode}/join`)
        .send({ playerId: PLAYER_A });
      const secret = joined.body.player.secretToken as string;
      await request(app)
        .post(`/sessions/invite/${inviteCode}/join`)
        .send({ playerId: PLAYER_B });

      const res = await request(app)
        .get(`/sessions/invite/${inviteCode}/match-analysis?viewerPlayerId=${PLAYER_A}`)
        .set("X-Player-Secret", secret);
      assert.equal(res.status, 409);
    } finally {
      await cleanupSession(inviteCode);
    }
  });
});
