import { prisma } from "../db/prisma.js";

export class ForbiddenRunError extends Error {
  constructor() {
    super(
      "Spieler-Anmeldung ungültig oder abgelaufen. Bitte dem Raum erneut beitreten.",
    );
    this.name = "ForbiddenRunError";
  }
}

/**
 * Multiplayer: `Player.secretToken` ist Pflicht.
 * API-Singleplayer: `Run.soloSecretToken` ist Pflicht, wenn gesetzt.
 * Legacy-Runs ohne Token bleiben offen (rückwärtskompatibel).
 */
export async function assertRunPlayerAccess(
  runId: string,
  token: string | undefined,
): Promise<void> {
  const player = await prisma.player.findUnique({ where: { runId } });
  if (player) {
    const t = token?.trim();
    if (!t || t !== player.secretToken) {
      throw new ForbiddenRunError();
    }
    return;
  }

  const run = await prisma.run.findUnique({
    where: { id: runId },
    select: { soloSecretToken: true },
  });
  if (run?.soloSecretToken) {
    const t = token?.trim();
    if (!t || t !== run.soloSecretToken) {
      throw new ForbiddenRunError();
    }
  }
}
