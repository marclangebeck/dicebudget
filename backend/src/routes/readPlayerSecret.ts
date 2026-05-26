import type { Request } from "express";

/** Multiplayer: Geheimnis pro Spieler (`X-Player-Secret`, Query oder Body). */
export function readPlayerSecret(req: Request): string | undefined {
  const h = req.headers["x-player-secret"];
  if (typeof h === "string" && h.trim()) return h.trim();

  const q = req.query["playerSecret"];
  if (typeof q === "string" && q.trim()) return q.trim();

  const b = req.body?.playerSecret;
  if (typeof b === "string" && b.trim()) return b.trim();

  return undefined;
}
