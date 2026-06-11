import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { prisma } from "../db/prisma.js";
import {
  PlayerAlreadyInSessionError,
  createGameSession,
  joinSession,
} from "./sessionService.js";

const PLAYER_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

async function cleanupSession(inviteCode: string): Promise<void> {
  const session = await prisma.gameSession.findUnique({
    where: { inviteCode },
  });
  if (!session) return;
  await prisma.gameSession.delete({ where: { id: session.id } });
}

describe("joinSession duplicate player", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("rejects joining the same playerId twice", async () => {
    const session = await createGameSession(1, 2, false);
    try {
      await joinSession(session.inviteCode, PLAYER_A);
      await assert.rejects(
        () => joinSession(session.inviteCode, PLAYER_A),
        (err: unknown) => err instanceof PlayerAlreadyInSessionError,
      );
    } finally {
      await cleanupSession(session.inviteCode);
    }
  });
});
