import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db/prisma.js";

describe("tournaments API", () => {
  const app = createApp();

  before(async () => {
    await prisma.tournamentEntry.deleteMany();
    await prisma.tournament.deleteMany();
  });

  after(async () => {
    await prisma.tournamentEntry.deleteMany();
    await prisma.tournament.deleteMany();
  });

  it("legt Turnier an, Join und Start mit Host-Token", async () => {
    const created = await request(app)
      .post("/tournaments")
      .send({ name: "Kneipe Freitag", modeKey: "league" })
      .expect(201);

    assert.equal(created.body.tournament.status, "OPEN");
    assert.ok(created.body.tournament.inviteCode);
    assert.ok(created.body.hostToken);
    assert.equal(created.body.tournament.config.rounds, 3);
    assert.equal(created.body.tournament.config.gameCount, 1);

    const code = created.body.tournament.inviteCode as string;
    const hostToken = created.body.hostToken as string;
    const tournamentId = created.body.tournament.id as string;

    await request(app)
      .post(`/tournaments/invite/${code}/join`)
      .send({ displayName: "Anna", playerId: "p-anna" })
      .expect(201);

    await request(app)
      .post(`/tournaments/invite/${code}/join`)
      .send({ displayName: "Ben", playerId: "p-ben" })
      .expect(201);

    const lobby = await request(app)
      .get(`/tournaments/invite/${code}`)
      .set("X-Host-Token", hostToken)
      .expect(200);

    assert.equal(lobby.body.tournament.entryCount, 2);
    assert.equal(lobby.body.tournament.entries.length, 2);
    assert.equal(lobby.body.tournament.entries[0].playerId, "p-anna");
    assert.equal(lobby.body.tournament.entries[1].playerId, "p-ben");

    const started = await request(app)
      .post(`/tournaments/${tournamentId}/start`)
      .set("X-Host-Token", hostToken)
      .expect(200);

    assert.equal(started.body.tournament.status, "RUNNING");

    await request(app)
      .post(`/tournaments/invite/${code}/join`)
      .send({ displayName: "Carla" })
      .expect(409);
  });

  it("nimmt Turnier-Config entgegen", async () => {
    const created = await request(app)
      .post("/tournaments")
      .send({
        name: "Cup",
        modeKey: "turnier",
        maxEntries: 16,
        config: {
          groupSize: 4,
          qualifyPerGroup: 2,
          gameCount: 2,
          useStrategyRules: false,
        },
      })
      .expect(201);

    assert.equal(created.body.tournament.config.groupSize, 4);
    assert.equal(created.body.tournament.config.qualifyPerGroup, 2);
    assert.equal(created.body.tournament.config.knockout, "single");
    assert.equal(created.body.tournament.config.gameCount, 2);
    assert.equal(created.body.tournament.config.useStrategyRules, false);
  });

  it("lehnt ungültige Liga-Config ab", async () => {
    await request(app)
      .post("/tournaments")
      .send({ modeKey: "league", config: { rounds: 99 } })
      .expect(400);
  });

  it("lehnt Start mit falschem Host-Token ab", async () => {
    const created = await request(app).post("/tournaments").send({}).expect(201);
    await request(app)
      .post(`/tournaments/${created.body.tournament.id}/start`)
      .set("X-Host-Token", "wrong")
      .expect(403);
  });
});
