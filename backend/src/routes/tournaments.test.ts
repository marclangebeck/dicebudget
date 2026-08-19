import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db/prisma.js";

describe("tournaments API", () => {
  const app = createApp();

  before(async () => {
    await prisma.tournamentMatch.deleteMany();
    await prisma.tournamentRound.deleteMany();
    await prisma.tournamentGroupStanding.deleteMany();
    await prisma.tournamentGroup.deleteMany();
    await prisma.tournamentEntry.deleteMany();
    await prisma.tournament.deleteMany();
  });

  after(async () => {
    await prisma.tournamentMatch.deleteMany();
    await prisma.tournamentRound.deleteMany();
    await prisma.tournamentGroupStanding.deleteMany();
    await prisma.tournamentGroup.deleteMany();
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
    assert.equal(started.body.tournament.groups.length, 1);
    assert.equal(started.body.tournament.groups[0].name, "Liga");
    assert.equal(started.body.tournament.groups[0].standings.length, 2);
    assert.equal(started.body.tournament.rounds.length, 1);
    assert.equal(started.body.tournament.rounds[0].matches.length, 1);
    assert.equal(started.body.scheduleMeta.releasedWave, 1);
    assert.equal(started.body.scheduleMeta.hasMoreRounds, true);
    const firstMatchId = started.body.tournament.rounds[0].matches[0].id as string;

    const sessionCreated = await request(app)
      .post(`/tournaments/${tournamentId}/matches/${firstMatchId}/session`)
      .set("X-Host-Token", hostToken)
      .expect(201);

    assert.ok(sessionCreated.body.sessionInviteCode);
    assert.match(sessionCreated.body.joinPath, /\/multi\/join\?code=/);
    assert.equal(
      sessionCreated.body.tournament.rounds[0].matches[0].sessionInviteCode.length,
      8,
    );

    await request(app)
      .post(`/tournaments/invite/${code}/join`)
      .send({ displayName: "Carla", playerId: "p-carla" })
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
          houseRules: { houseRulesBurn: false, houseRulesYatzyStreakCredit: true },
        },
      })
      .expect(201);

    assert.equal(created.body.tournament.config.groupSize, 4);
    assert.equal(created.body.tournament.config.qualifyPerGroup, 2);
    assert.equal(created.body.tournament.config.knockout, "single");
    assert.equal(created.body.tournament.config.gameCount, 2);
    assert.equal(created.body.tournament.config.useStrategyRules, false);
    assert.equal(created.body.tournament.config.houseRules.houseRulesBurn, false);
    assert.equal(created.body.tournament.config.houseRules.houseRulesYatzyStreak, true);
    assert.equal(
      created.body.tournament.config.houseRules.houseRulesYatzyStreakCredit,
      true,
    );
  });

  it("lost Gruppen und erzeugt Gruppenrunden beim Turnierstart", async () => {
    const created = await request(app)
      .post("/tournaments")
      .send({
        name: "Sommer-Cup",
        modeKey: "turnier",
        maxEntries: 8,
        config: { groupSize: 4, qualifyPerGroup: 2 },
      })
      .expect(201);

    const code = created.body.tournament.inviteCode as string;
    const hostToken = created.body.hostToken as string;
    const tournamentId = created.body.tournament.id as string;

    for (const name of ["Anna", "Ben", "Carla", "Dora", "Emil", "Fritz", "Gabi", "Hugo"]) {
      await request(app)
        .post(`/tournaments/invite/${code}/join`)
        .send({ displayName: name, playerId: `pid-${name.toLowerCase()}` })
        .expect(201);
    }

    const started = await request(app)
      .post(`/tournaments/${tournamentId}/start`)
      .set("X-Host-Token", hostToken)
      .expect(200);

    assert.equal(started.body.tournament.status, "RUNNING");
    assert.equal(started.body.tournament.groups.length, 2);
    assert.equal(started.body.tournament.rounds.length, 2);
    assert.equal(
      started.body.tournament.groups.reduce(
        (sum: number, group: { standings: unknown[] }) => sum + group.standings.length,
        0,
      ),
      8,
    );
    assert.ok(
      started.body.tournament.rounds.every(
        (round: { matches: unknown[]; phase: string }) =>
          round.phase === "GROUP" && round.matches.length === 2,
      ),
    );
    assert.equal(started.body.scheduleMeta.hasMoreRounds, true);

    const released = await request(app)
      .post(`/tournaments/${tournamentId}/rounds`)
      .set("X-Host-Token", hostToken)
      .expect(200);

    assert.equal(released.body.tournament.rounds.length, 4);
    assert.equal(released.body.scheduleMeta.releasedWave, 2);
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

  it("bereitet Auslosung vor, mischt und tauscht Heim/Auswärts", async () => {
    const created = await request(app)
      .post("/tournaments")
      .send({ name: "Draw Test", modeKey: "league" })
      .expect(201);

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

    const prepared = await request(app)
      .post(`/tournaments/${tournamentId}/draw`)
      .set("X-Host-Token", hostToken)
      .send({ action: "prepare" })
      .expect(200);

    assert.ok(prepared.body.drawPreview);
    assert.equal(prepared.body.drawPreview.rounds.length, 3);
    const beforeSwap = prepared.body.drawPreview.rounds[0].pairs[0];

    const swapped = await request(app)
      .patch(`/tournaments/${tournamentId}/draw`)
      .set("X-Host-Token", hostToken)
      .send({ planRoundIndex: 0, matchIndex: 1, swapSides: true })
      .expect(200);

    const afterSwap = swapped.body.drawPreview.rounds[0].pairs[0];
    assert.equal(afterSwap.homeEntryId, beforeSwap.awayEntryId);
    assert.equal(afterSwap.awayEntryId, beforeSwap.homeEntryId);
  });
});
