import { normalizePublicPlayerId, getOrCreatePlayerId } from "@/lib/playerIdentity";

const TOKEN_KEY = "dicebudget.playerNameToken.v1";
const SETUP_KEY = "dicebudget.playerName.setup.v1";
const NAME_KEY = "dicebudget.ownDisplayName.v1";
export const PLAYER_NAME_CHANGED_EVENT = "dicebudget-player-name-changed";

export function hasCompletedOwnNameSetup(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SETUP_KEY) === "1";
}

export function loadOwnNameToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function loadOwnDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(NAME_KEY)?.trim();
  return raw || null;
}

export function persistOwnPlayerName(name: string, nameToken: string): void {
  window.localStorage.setItem(TOKEN_KEY, nameToken);
  window.localStorage.setItem(SETUP_KEY, "1");
  window.localStorage.setItem(NAME_KEY, name.trim());
  window.dispatchEvent(new Event(PLAYER_NAME_CHANGED_EVENT));
}

export function clearOwnPlayerNameLocal(options?: { keepSetup?: boolean }): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(NAME_KEY);
  if (!options?.keepSetup) {
    window.localStorage.removeItem(SETUP_KEY);
  }
  window.dispatchEvent(new Event(PLAYER_NAME_CHANGED_EVENT));
}

export function subscribeOwnPlayerName(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(PLAYER_NAME_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(PLAYER_NAME_CHANGED_EVENT, onChange);
}

export function ownNameAliasOverlay(): Record<string, string> {
  const name = loadOwnDisplayName()?.trim();
  if (!name) return {};
  return { [normalizePublicPlayerId(getOrCreatePlayerId())]: name };
}
