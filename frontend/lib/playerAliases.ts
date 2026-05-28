import { normalizePublicPlayerId } from "@/lib/playerIdentity";

const STORAGE_KEY = "dicebudget.playerAliases.v1";

export type PlayerAliasMap = Record<string, string>;

export function loadPlayerAliases(): PlayerAliasMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const cleaned: PlayerAliasMap = {};
    for (const [playerId, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.trim()) {
        cleaned[normalizePublicPlayerId(playerId)] = value.trim();
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

function savePlayerAliases(aliases: PlayerAliasMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(aliases));
}

export function setPlayerAlias(playerId: string, alias: string): PlayerAliasMap {
  const normalizedId = normalizePublicPlayerId(playerId);
  const normalizedAlias = alias.trim();
  const current = loadPlayerAliases();
  if (!normalizedAlias) {
    delete current[normalizedId];
  } else {
    current[normalizedId] = normalizedAlias;
  }
  savePlayerAliases(current);
  return current;
}

