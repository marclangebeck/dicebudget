import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { prisma } from "../db/prisma.js";
import { finalizeSessionStats } from "./sessionService.js";
import {
  invalidatePairingStatsCache,
  pairingStatsCacheStateForTests,
  primePairingStatsCacheForTests,
  emptyAccumulator,
} from "./pairingStats.js";

const PLAYER_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0001";
const PLAYER_B = "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeee0001";

async function createReadySession(opts?: {
  pointsAwarded?: boolean;
  includeInPairingStats?: boolean;
}) {
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
      leagueId: league.id,
      pointsAwarded: opts?.pointsAwarded ?? false,
      includeInPairingStats: opts?.includeInPairingStats ?? true,
      status: opts?.pointsAwarded ? "FINISHED" : "RUNNING",
      players: {
        create: [
          {
            name: `pid:${PLAYER_A}`,
            orderIndex: 0,
            secretToken: secretA,
            runId: runA.id,
          },
          {
            name: `pid:${PLAYER_B}`,
            orderIndex: 1,
            secretToken: secretB,
            runId: runB.id,
          },
        ],
      },
    },
  });
  return { league, session, inviteCode, secretA, secretB, runA, runB };
}

async function cleanup(ctx: Awaited<ReturnType<typeof createReadySession>>) {
  await prisma.gameSession.deleteMany({ where: { id: ctx.session.id } });
  await prisma.leagueStanding.deleteMany({ where: { leagueId: ctx.league.id } });
  await prisma.league.delete({ where: { id: ctx.league.id } });
  await prisma.run.deleteMany({ where: { id: { in: [ctx.runA.id, ctx.runB.id] } } });
}

describe("finalizeSessionStats", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("ist idempotent: zweite Entscheidung ändert includeInPairingStats nicht", async () => {
    const ctx = await createReadySession();
    try {
      await finalizeSessionStats(ctx.inviteCode, true, ctx.secretA);
      await finalizeSessionStats(ctx.inviteCode, false, ctx.secretA);

      const row = await prisma.gameSession.findUnique({ where: { id: ctx.session.id } });
      assert.equal(row?.pointsAwarded, true);
      assert.equal(row?.includeInPairingStats, true);
    } finally {
      await cleanup(ctx);
    }
  });

  it("bei parallelem Werten/Nicht-werten gewinnt genau eine Entscheidung", async () => {
    const ctx = await createReadySession();
    try {
      await Promise.all([
        finalizeSessionStats(ctx.inviteCode, true, ctx.secretA),
        finalizeSessionStats(ctx.inviteCode, false, ctx.secretB),
      ]);

      const row = await prisma.gameSession.findUnique({ where: { id: ctx.session.id } });
      assert.equal(row?.pointsAwarded, true);
      assert.ok(
        row?.includeInPairingStats === true || row?.includeInPairingStats === false,
      );
      // Genau eine klare Entscheidung — nicht „geawardet aber exclude“-Mix aus Race.
      if (row?.includeInPairingStats) {
        const standings = await prisma.leagueStanding.count({
          where: { leagueId: ctx.league.id },
        });
        assert.ok(standings >= 1);
      } else {
        const standings = await prisma.leagueStanding.count({
          where: { leagueId: ctx.league.id },
        });
        assert.equal(standings, 0);
      }
    } finally {
      await cleanup(ctx);
    }
  });

  it("invalidiert Pairing-Cache nach Finalize", async () => {
    const ctx = await createReadySession();
    try {
      const map = new Map();
      map.set("A::B", emptyAccumulator("A::B", "A", "B"));
      primePairingStatsCacheForTests(map);
      assert.equal(pairingStatsCacheStateForTests().active, true);

      await finalizeSessionStats(ctx.inviteCode, false, ctx.secretA);

      assert.equal(pairingStatsCacheStateForTests().active, false);
    } finally {
      invalidatePairingStatsCache();
      await cleanup(ctx);
    }
  });
});
