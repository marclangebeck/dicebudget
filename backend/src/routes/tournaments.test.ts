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

  it("lehnt Start mit falschem Host-Token ab", async () => {
    const created = await request(app).post("/tournaments").send({}).expect(201);
    await request(app)
      .post(`/tournaments/${created.body.tournament.id}/start`)
      .set("X-Host-Token", "wrong")
      .expect(403);
  });
});
