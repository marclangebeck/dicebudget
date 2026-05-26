import { prisma } from "../db/prisma.js";

export class ForbiddenRunError extends Error {
  constructor() {
    super("Invalid or missing player token for multiplayer run");
    this.name = "ForbiddenRunError";
  }
}

/**
 * Für Multiplayer-Läufe (`Player`-Zeile vorhanden) ist `secretToken`
 * Pflicht; Singleplayer ohne Player bleibt offen (nur wer `runId` kennt).
 */
export async function assertRunPlayerAccess(
  runId: string,
  token: string | undefined,
): Promise<void> {
  const player = await prisma.player.findUnique({ where: { runId } });
  if (!player) return;
  const t = token?.trim();
  if (!t || t !== player.secretToken) {
    throw new ForbiddenRunError();
  }
}
