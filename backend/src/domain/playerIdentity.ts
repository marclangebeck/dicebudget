import { createHash } from "crypto";

export const PLAYER_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePlayerId(playerId: string): string {
  return playerId.trim().toLowerCase();
}

export function isValidPlayerId(playerId: string): boolean {
  return PLAYER_ID_REGEX.test(normalizePlayerId(playerId));
}

export function playerTokenFromId(playerId: string): string {
  return `pid:${normalizePlayerId(playerId)}`;
}

export function parsePlayerToken(token: string): string | null {
  if (!token.startsWith("pid:")) return null;
  const playerId = normalizePlayerId(token.slice(4));
  return playerId || null;
}

function stableLegacyId(raw: string): string {
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  return `legacy:${hash}`;
}

/** Liefert immer eine pseudonyme, clienttaugliche Spieler-ID. */
export function publicPlayerIdFromStoredName(storedName: string): string {
  const playerId = parsePlayerToken(storedName);
  if (playerId) return playerId;
  return stableLegacyId(storedName);
}

