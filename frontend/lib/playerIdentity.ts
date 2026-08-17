const PLAYER_ID_KEY = "dicebudget.playerId";

function fallbackUuid(): string {
  return `legacy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") {
    return fallbackUuid();
  }
  const existing = window.localStorage.getItem(PLAYER_ID_KEY)?.trim();
  if (existing) return existing;

  const created =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : fallbackUuid();
  window.localStorage.setItem(PLAYER_ID_KEY, created);
  return created;
}

export function normalizePublicPlayerId(playerId: string): string {
  let normalized = playerId.trim().toLowerCase();
  if (normalized.startsWith("pid:")) normalized = normalized.slice(4);
  return normalized;
}

export function shortPlayerId(playerId: string): string {
  let normalized = normalizePublicPlayerId(playerId);
  if (normalized.startsWith("legacy:")) normalized = normalized.slice(7);
  return normalized.slice(0, 8).toUpperCase();
}

export function playerLabel(
  playerId: string,
  ownPlayerId?: string,
  aliases?: Record<string, string>,
): string {
  const normalized = normalizePublicPlayerId(playerId);
  const stripped = normalized.startsWith("legacy:") ? normalized.slice(7) : normalized;
  const alias = aliases?.[normalized]?.trim() || aliases?.[stripped]?.trim();
  if (alias) return alias;
  if (ownPlayerId && normalized === normalizePublicPlayerId(ownPlayerId)) return "Du";
  return `Unbekannt (${shortPlayerId(playerId)})`;
}

