import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "../db/prisma.js";
import { finalizeSessionStats } from "./sessionService.js";
import { maybeGenerateKoBracketForTournament } from "./tournamentService.js";

async function cleanupTournamentTestData() {
  await prisma.tournamentMatch.deleteMany();
  await prisma.tournamentRound.deleteMany();
  await prisma.tournamentGroupStanding.deleteMany();
  await prisma.tournamentGroup.deleteMany();
  await prisma.tournamentEntry.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.player.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.run.deleteMany();
  await prisma.league.deleteMany();
}

function uniqueCode(prefix: string, len = 8) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`.slice(0, len);
}

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
      await cleanupTournamentTestData();
    }
  });

  it("markiert Liga als FINISHED wenn das letzte Liga-Match endet", async () => {
    const tournament = await prisma.tournament.create({
      data: {
        inviteCode: uniqueCode("L", 12),
        name: "Liga-Finale",
        modeKey: "league",
        status: "RUNNING",
        hostToken: "host-league-finish",
        maxEntries: 2,
        config: JSON.stringify({ rounds: 1 }),
      },
    });

    const homeEntry = await prisma.tournamentEntry.create({
      data: {
        tournamentId: tournament.id,
        displayName: "Anna",
        playerId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee1001",
        orderIndex: 0,
      },
    });
    const awayEntry = await prisma.tournamentEntry.create({
      data: {
        tournamentId: tournament.id,
        displayName: "Ben",
        playerId: "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeee1001",
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

    await prisma.tournamentGroupStanding.createMany({
      data: [
        { tournamentId: tournament.id, groupId: group.id, entryId: homeEntry.id },
        { tournamentId: tournament.id, groupId: group.id, entryId: awayEntry.id },
      ],
    });

    const league = await prisma.league.create({
      data: { leagueCode: uniqueCode("LG", 10) },
    });
    const runA = await prisma.run.create({
      data: {
        gameCount: 1,
        useStrategyRules: false,
        status: "FINISHED",
        totalScore: 211,
        finishedAt: new Date(),
      },
    });
    const runB = await prisma.run.create({
      data: {
        gameCount: 1,
        useStrategyRules: false,
        status: "FINISHED",
        totalScore: 198,
        finishedAt: new Date(),
      },
    });

    const session = await prisma.gameSession.create({
      data: {
        inviteCode: uniqueCode("S", 8),
        gameCount: 1,
        maxPlayers: 2,
        useStrategyRules: false,
        leagueId: league.id,
        status: "RUNNING",
        pointsAwarded: false,
        includeInPairingStats: false,
        players: {
          create: [
            {
              name: `pid:${homeEntry.playerId}`,
              orderIndex: 0,
              secretToken: "league-finish-a",
              runId: runA.id,
            },
            {
              name: `pid:${awayEntry.playerId}`,
              orderIndex: 1,
              secretToken: "league-finish-b",
              runId: runB.id,
            },
          ],
        },
      },
    });

    await prisma.tournamentRound.create({
      data: {
        tournamentId: tournament.id,
        groupId: group.id,
        phase: "LEAGUE",
        roundIndex: 1,
        title: "Spieltag 1",
      },
    });

    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tournament.id,
        groupId: group.id,
        phase: "LEAGUE",
        matchIndex: 1,
        homeEntryId: homeEntry.id,
        awayEntryId: awayEntry.id,
        sessionId: session.id,
        status: "READY",
      },
    });

    try {
      await finalizeSessionStats(session.inviteCode, false, "league-finish-a");

      const updatedTournament = await prisma.tournament.findUnique({
        where: { id: tournament.id },
      });
      assert.equal(updatedTournament?.status, "FINISHED");
    } finally {
      await cleanupTournamentTestData();
    }
  });

  it("erzeugt ein KO-Bracket mit Bye robust aus abgeschlossener Gruppenphase", async () => {
    const tournament = await prisma.tournament.create({
      data: {
        inviteCode: uniqueCode("K", 12),
        name: "KO-Bye-Test",
        modeKey: "turnier",
        status: "RUNNING",
        hostToken: "host-ko-bye",
        maxEntries: 9,
        config: JSON.stringify({ groupSize: 3, qualifyPerGroup: 1, gameCount: 1 }),
      },
    });

    const entryIds: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const group = await prisma.tournamentGroup.create({
        data: {
          tournamentId: tournament.id,
          name: `Gruppe ${String.fromCharCode(65 + i)}`,
          sortOrder: i,
        },
      });

      const topEntry = await prisma.tournamentEntry.create({
        data: {
          tournamentId: tournament.id,
          displayName: `Top ${i + 1}`,
          playerId: `00000000-0000-4000-8000-00000000010${i}`,
          orderIndex: i,
        },
      });
      entryIds.push(topEntry.id);

      await prisma.tournamentGroupStanding.create({
        data: {
          tournamentId: tournament.id,
          groupId: group.id,
          entryId: topEntry.id,
          rank: 1,
          matchesPlayed: 2,
          wins: 2,
          points: 2,
          totalScoreDiff: 50 - i,
          totalScoreFor: 500 - i,
          totalScoreAgainst: 450,
        },
      });

      await prisma.tournamentMatch.create({
        data: {
          tournamentId: tournament.id,
          groupId: group.id,
          phase: "GROUP",
          matchIndex: 1,
          homeEntryId: topEntry.id,
          awayEntryId: topEntry.id,
          status: "FINISHED",
          homeScore: 100,
          awayScore: 90,
          winnerEntryId: topEntry.id,
        },
      });
    }

    try {
      await maybeGenerateKoBracketForTournament(tournament.id);

      const koRounds = await prisma.tournamentRound.findMany({
        where: { tournamentId: tournament.id },
        orderBy: [{ phase: "asc" }, { roundIndex: "asc" }],
      });
      const koMatches = await prisma.tournamentMatch.findMany({
        where: { tournamentId: tournament.id, phase: "KO" },
        orderBy: [{ roundId: "asc" }, { matchIndex: "asc" }],
        include: {
          round: { select: { roundIndex: true, phase: true } },
          homeEntry: true,
          awayEntry: true,
        },
      });

      assert.ok(koRounds.some((round) => round.phase === "KO"));
      assert.ok(koRounds.some((round) => round.phase === "KO_THIRD"));

      const semifinals = koMatches.filter(
        (match) => match.round?.phase === "KO" && match.round.roundIndex === 1,
      );
      assert.equal(semifinals.length, 2);
      assert.ok(
        semifinals.some(
          (match) =>
            match.status === "FINISHED" &&
            (match.homeEntry.playerId == null || match.awayEntry.playerId == null),
        ),
      );
      assert.ok(
        semifinals.some(
          (match) =>
            match.status === "READY" &&
            match.sessionId != null &&
            match.homeEntry.playerId != null &&
            match.awayEntry.playerId != null,
        ),
      );

      const finalMatch = koMatches.find(
        (match) => match.round?.phase === "KO" && match.round.roundIndex === 2,
      );
      assert.equal(finalMatch?.status, "PENDING");
    } finally {
      await cleanupTournamentTestData();
    }
  });

  it("beendet ein 2er-KO-Turnier nach dem Finale automatisch", async () => {
    const tournament = await prisma.tournament.create({
      data: {
        inviteCode: uniqueCode("F", 12),
        name: "Finale-Test",
        modeKey: "turnier",
        status: "RUNNING",
        hostToken: "host-finale",
        maxEntries: 2,
        config: JSON.stringify({ groupSize: 2, qualifyPerGroup: 1, gameCount: 1 }),
      },
    });

    const homeEntry = await prisma.tournamentEntry.create({
      data: {
        tournamentId: tournament.id,
        displayName: "Finalist A",
        playerId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee2001",
        orderIndex: 0,
      },
    });
    const awayEntry = await prisma.tournamentEntry.create({
      data: {
        tournamentId: tournament.id,
        displayName: "Finalist B",
        playerId: "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeee2001",
        orderIndex: 1,
      },
    });

    const league = await prisma.league.create({
      data: { leagueCode: uniqueCode("KF", 10) },
    });
    const runA = await prisma.run.create({
      data: {
        gameCount: 1,
        useStrategyRules: false,
        status: "FINISHED",
        totalScore: 320,
        finishedAt: new Date(),
      },
    });
    const runB = await prisma.run.create({
      data: {
        gameCount: 1,
        useStrategyRules: false,
        status: "FINISHED",
        totalScore: 310,
        finishedAt: new Date(),
      },
    });

    const session = await prisma.gameSession.create({
      data: {
        inviteCode: uniqueCode("Q", 8),
        gameCount: 1,
        maxPlayers: 2,
        useStrategyRules: false,
        leagueId: league.id,
        status: "RUNNING",
        pointsAwarded: false,
        includeInPairingStats: false,
        koTieBreakEnabled: true,
        players: {
          create: [
            {
              name: `pid:${homeEntry.playerId}`,
              orderIndex: 0,
              secretToken: "ko-final-a",
              runId: runA.id,
            },
            {
              name: `pid:${awayEntry.playerId}`,
              orderIndex: 1,
              secretToken: "ko-final-b",
              runId: runB.id,
            },
          ],
        },
      },
    });

    const finalRound = await prisma.tournamentRound.create({
      data: {
        tournamentId: tournament.id,
        phase: "KO",
        roundIndex: 1,
        title: "Finale",
      },
    });

    const finalMatch = await prisma.tournamentMatch.create({
      data: {
        tournamentId: tournament.id,
        roundId: finalRound.id,
        phase: "KO",
        matchIndex: 1,
        homeEntryId: homeEntry.id,
        awayEntryId: awayEntry.id,
        sessionId: session.id,
        status: "READY",
      },
    });

    try {
      await finalizeSessionStats(session.inviteCode, false, "ko-final-a");

      const updatedTournament = await prisma.tournament.findUnique({
        where: { id: tournament.id },
      });
      const updatedFinalMatch = await prisma.tournamentMatch.findUnique({
        where: { id: finalMatch.id },
      });

      assert.equal(updatedFinalMatch?.status, "FINISHED");
      assert.equal(updatedFinalMatch?.winnerEntryId, homeEntry.id);
      assert.equal(updatedTournament?.status, "FINISHED");
    } finally {
      await cleanupTournamentTestData();
    }
  });
});

