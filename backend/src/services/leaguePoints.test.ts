import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { prisma } from "../db/prisma.js";
import { computeRoundPoints, getLeagueStandings, rebuildLeagueStandings } from "./leaguePoints.js";

describe("computeRoundPoints", () => {
  it("vergibt Sieger 1 Punkt und Differenzbonus, Verlierer 0", () => {
    const awards = computeRoundPoints([
      { name: "Anna", totalScore: 320, orderIndex: 1 },
      { name: "Bob", totalScore: 280, orderIndex: 2 },
    ]);

    assert.deepEqual(
      awards.find((a) => a.playerName === "Anna"),
      { playerName: "Anna", winPoints: 1, bonusPoints: 40 },
    );
    assert.deepEqual(
      awards.find((a) => a.playerName === "Bob"),
      { playerName: "Bob", winPoints: 0, bonusPoints: 0 },
    );
  });

  it("nutzt den Letztplatzierten bei drei Spielern für die Differenz", () => {
    const awards = computeRoundPoints([
      { name: "Anna", totalScore: 300, orderIndex: 1 },
      { name: "Bob", totalScore: 250, orderIndex: 2 },
      { name: "Clara", totalScore: 200, orderIndex: 3 },
    ]);

    assert.deepEqual(
      awards.find((a) => a.playerName === "Anna"),
      { playerName: "Anna", winPoints: 1, bonusPoints: 100 },
    );
    assert.deepEqual(
      awards.find((a) => a.playerName === "Bob"),
      { playerName: "Bob", winPoints: 0, bonusPoints: 0 },
    );
  });

  it("löst Punktgleichstand über orderIndex", () => {
    const awards = computeRoundPoints([
      { name: "Anna", totalScore: 300, orderIndex: 1 },
      { name: "Bob", totalScore: 300, orderIndex: 2 },
    ]);

    assert.deepEqual(
      awards.find((a) => a.playerName === "Anna"),
      { playerName: "Anna", winPoints: 1, bonusPoints: 0 },
    );
    assert.deepEqual(
      awards.find((a) => a.playerName === "Bob"),
      { playerName: "Bob", winPoints: 0, bonusPoints: 0 },
    );
  });

  it("gibt bei weniger als zwei Spielern nichts zurück", () => {
    assert.deepEqual(computeRoundPoints([{ name: "Anna", totalScore: 100, orderIndex: 1 }]), []);
  });
});

describe("rebuildLeagueStandings", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("ersetzt veraltete Ligapunkte durch Summe verbleibender Sessions", async () => {
    const league = await prisma.league.create({
      data: { leagueCode: `M29-${Date.now()}` },
    });
    const runA = await prisma.run.create({
      data: {
        gameCount: 1,
        useStrategyRules: false,
        status: "FINISHED",
        totalScore: 300,
        finishedAt: new Date(),
      },
    });
    const runB = await prisma.run.create({
      data: {
        gameCount: 1,
        useStrategyRules: false,
        status: "FINISHED",
        totalScore: 250,
        finishedAt: new Date(),
      },
    });

    const inviteCode = `M29${Date.now().toString(36).toUpperCase()}`.slice(0, 8);
    await prisma.gameSession.create({
      data: {
        inviteCode,
        gameCount: 1,
        maxPlayers: 2,
        leagueId: league.id,
        pointsAwarded: true,
        status: "FINISHED",
        players: {
          create: [
            {
              name: "pid:player-a",
              orderIndex: 0,
              secretToken: `sec-a-${Date.now()}`,
              runId: runA.id,
            },
            {
              name: "pid:player-b",
              orderIndex: 1,
              secretToken: `sec-b-${Date.now()}`,
              runId: runB.id,
            },
          ],
        },
      },
    });

    await prisma.leagueStanding.create({
      data: {
        leagueId: league.id,
        playerName: "pid:player-a",
        winPoints: 99,
        bonusPoints: 99,
      },
    });

    try {
      await rebuildLeagueStandings(league.id);
      const standings = await getLeagueStandings(league.id);
      const winner = standings.find((row) => row.playerId === "player-a");
      assert.ok(winner);
      assert.equal(winner.winPoints, 1);
      assert.equal(winner.bonusPoints, 50);
    } finally {
      await prisma.gameSession.deleteMany({ where: { leagueId: league.id } });
      await prisma.leagueStanding.deleteMany({ where: { leagueId: league.id } });
      await prisma.league.delete({ where: { id: league.id } });
      await prisma.run.deleteMany({ where: { id: { in: [runA.id, runB.id] } } });
    }
  });
});
