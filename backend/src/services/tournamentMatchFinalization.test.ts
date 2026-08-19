import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "../db/prisma.js";
import { finalizeSessionStats } from "./sessionService.js";

describe("tournament match finalization", () => {
  it("schreibt Liga-Ergebnis in TournamentMatch und aktualisiert Tabelle", async () => {
    const tournament = await prisma.tournament.create({
      data: {
        inviteCode: `T${Date.now().toString(36).toUpperCase()}`.slice(0, 12),
        name: "Test-Turnier",
        modeKey: "league",
        status: "RUNNING",
        hostToken: "host-test",
        maxEntries: 2,
        config: JSON.stringify({ rounds: 1 }),
      },
    });

    const homeEntry = await prisma.tournamentEntry.create({
      data: {
        tournamentId: tournament.id,
        displayName: "A",
        playerId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0001",
        orderIndex: 0,
      },
    });
    const awayEntry = await prisma.tournamentEntry.create({
      data: {
        tournamentId: tournament.id,
        displayName: "B",
        playerId: "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeee0001",
        orderIndex: 1,
      },
    });

    const group = await prisma.tournamentGroup.create({
      data: {
        tournamentId: tournament.id,
        name: "Liga",
        sortOrder: 0,
      },
    });

    const homeStanding = await prisma.tournamentGroupStanding.create({
      data: {
        tournamentId: tournament.id,
        groupId: group.id,
        entryId: homeEntry.id,
      },
    });
    const awayStanding = await prisma.tournamentGroupStanding.create({
      data: {
        tournamentId: tournament.id,
        groupId: group.id,
        entryId: awayEntry.id,
      },
    });

    const league = await prisma.league.create({
      data: { leagueCode: `FIN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
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

    const secretA = `sec-a-${Date.now()}`;
    const secretB = `sec-b-${Date.now()}`;
    const inviteCode = `F${Date.now().toString(36).toUpperCase()}`.slice(0, 8);

    const session = await prisma.gameSession.create({
      data: {
        inviteCode,
        gameCount: 1,
        maxPlayers: 2,
        useStrategyRules: false,
        leagueId: league.id,
        status: "RUNNING",
        pointsAwarded: false,
        includeInPairingStats: true,
        players: {
          create: [
            {
              name: `pid:${homeEntry.playerId}`,
              orderIndex: 0,
              secretToken: secretA,
              runId: runA.id,
            },
            {
              name: `pid:${awayEntry.playerId}`,
              orderIndex: 1,
              secretToken: secretB,
              runId: runB.id,
            },
          ],
        },
      },
    });

    const match = await prisma.tournamentMatch.create({
      data: {
        tournamentId: tournament.id,
        groupId: group.id,
        roundId: null,
        phase: "LEAGUE",
        bracketSlot: null,
        matchIndex: 1,
        homeEntryId: homeEntry.id,
        awayEntryId: awayEntry.id,
        sessionId: session.id,
        status: "READY",
        tieBreakNeeded: false,
      },
    });

    try {
      await finalizeSessionStats(inviteCode, false, secretA);

      const updatedMatch = await prisma.tournamentMatch.findUnique({
        where: { id: match.id },
      });
      assert.equal(updatedMatch?.status, "FINISHED");
      assert.equal(updatedMatch?.homeScore, 300);
      assert.equal(updatedMatch?.awayScore, 250);
      assert.equal(updatedMatch?.homePointsAwarded, 1);
      assert.equal(updatedMatch?.awayPointsAwarded, 0);
      assert.equal(updatedMatch?.winnerEntryId, homeEntry.id);

      const updatedHomeStanding = await prisma.tournamentGroupStanding.findUnique({
        where: { id: homeStanding.id },
      });
      const updatedAwayStanding = await prisma.tournamentGroupStanding.findUnique({
        where: { id: awayStanding.id },
      });

      assert.equal(updatedHomeStanding?.matchesPlayed, 1);
      assert.equal(updatedHomeStanding?.wins, 1);
      assert.equal(updatedHomeStanding?.draws, 0);
      assert.equal(updatedHomeStanding?.losses, 0);
      assert.equal(updatedHomeStanding?.points, 1);
      assert.equal(updatedHomeStanding?.totalScoreDiff, 50);

      assert.equal(updatedAwayStanding?.matchesPlayed, 1);
      assert.equal(updatedAwayStanding?.wins, 0);
      assert.equal(updatedAwayStanding?.draws, 0);
      assert.equal(updatedAwayStanding?.losses, 1);
      assert.equal(updatedAwayStanding?.points, 0);
      assert.equal(updatedAwayStanding?.totalScoreDiff, -50);
    } finally {
      await prisma.tournamentMatch.deleteMany();
      await prisma.tournamentGroupStanding.deleteMany();
      await prisma.tournamentRound.deleteMany();
      await prisma.tournamentGroup.deleteMany();
      await prisma.tournamentEntry.deleteMany();
      await prisma.tournament.deleteMany();
      await prisma.player.deleteMany();
      await prisma.run.deleteMany();
      await prisma.gameSession.deleteMany();
      await prisma.league.deleteMany();
    }
  });
});

