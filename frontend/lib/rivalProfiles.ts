/**
 * Lokale Rivalen-Profile: Personen mit Anzeigenamen und verknüpften playerIds.
 * Server bleibt pseudonym — Lesbarkeit nur auf diesem Gerät.
 */

import { loadPlayerAliases, setPlayerAlias } from "@/lib/playerAliases";
import { normalizePublicPlayerId } from "@/lib/playerIdentity";

const STORAGE_KEY = "dicebudget.rivalProfiles.v1";
const MIGRATED_KEY = "dicebudget.rivalProfiles.migratedFromAliases.v1";
export const RIVAL_PROFILES_CHANGED_EVENT = "dicebudget:rival-profiles-changed";

export type RivalProfile = {
  id: string;
  name: string;
  playerIds: string[];
};

function createId(): string {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `rival-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readProfiles(): RivalProfile[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: RivalProfile[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Partial<RivalProfile>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const id = typeof row.id === "string" ? row.id : createId();
      const playerIds = Array.isArray(row.playerIds)
        ? [
            ...new Set(
              row.playerIds
                .filter((value): value is string => typeof value === "string")
                .map((value) => normalizePublicPlayerId(value))
                .filter(Boolean),
            ),
          ]
        : [];
      if (!name || playerIds.length === 0) continue;
      out.push({ id, name, playerIds });
    }
    return out;
  } catch {
    return [];
  }
}

function writeProfiles(profiles: RivalProfile[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  window.dispatchEvent(new Event(RIVAL_PROFILES_CHANGED_EVENT));
}

/** Einmalig: bestehende Aliase → Rivalen-Profile. */
export function migrateAliasesToRivalProfiles(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATED_KEY) === "1") return;
  const aliases = loadPlayerAliases();
  const existing = readProfiles();
  const byId = new Map(existing.map((profile) => [profile.id, profile]));
  for (const [playerId, name] of Object.entries(aliases)) {
    const normalizedId = normalizePublicPlayerId(playerId);
    const trimmed = name.trim();
    if (!normalizedId || !trimmed) continue;
    const already = [...byId.values()].find((profile) =>
      profile.playerIds.includes(normalizedId),
    );
    if (already) {
      already.name = trimmed;
      continue;
    }
    const sameName = [...byId.values()].find(
      (profile) => profile.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (sameName) {
      if (!sameName.playerIds.includes(normalizedId)) {
        sameName.playerIds.push(normalizedId);
      }
      continue;
    }
    const profile: RivalProfile = {
      id: createId(),
      name: trimmed,
      playerIds: [normalizedId],
    };
    byId.set(profile.id, profile);
  }
  writeProfiles([...byId.values()]);
  window.localStorage.setItem(MIGRATED_KEY, "1");
}

export function loadRivalProfiles(): RivalProfile[] {
  migrateAliasesToRivalProfiles();
  return readProfiles();
}

/** playerId → Anzeigename aus Rivalen (+ ggf. Alias-Fallback bereits migriert). */
export function getRivalDisplayMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const profile of loadRivalProfiles()) {
    for (const playerId of profile.playerIds) {
      map[playerId] = profile.name;
    }
  }
  return map;
}

/**
 * Rivalen-Namen für Statistik/Labels — Alias-Map kompatibel.
 * Schreibt bei Speichern auch in die Alias-Map (Rückwärtskompatibilität).
 */
export function loadDisplayNames(): Record<string, string> {
  migrateAliasesToRivalProfiles();
  const fromRivals = getRivalDisplayMap();
  const fromAliases = loadPlayerAliases();
  return { ...fromAliases, ...fromRivals };
}

export function upsertRivalName(playerId: string, name: string): Record<string, string> {
  const normalizedId = normalizePublicPlayerId(playerId);
  const trimmed = name.trim();
  const profiles = loadRivalProfiles();

  if (!trimmed) {
    const next = profiles
      .map((profile) => ({
        ...profile,
        playerIds: profile.playerIds.filter((id) => id !== normalizedId),
      }))
      .filter((profile) => profile.playerIds.length > 0);
    writeProfiles(next);
    setPlayerAlias(normalizedId, "");
    return loadDisplayNames();
  }

  const existing = profiles.find((profile) => profile.playerIds.includes(normalizedId));
  if (existing) {
    existing.name = trimmed;
    writeProfiles(profiles);
  } else {
    const sameName = profiles.find(
      (profile) => profile.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (sameName) {
      sameName.playerIds.push(normalizedId);
      writeProfiles(profiles);
    } else {
      writeProfiles([
        ...profiles,
        { id: createId(), name: trimmed, playerIds: [normalizedId] },
      ]);
    }
  }
  setPlayerAlias(normalizedId, trimmed);
  return loadDisplayNames();
}

export function isNamedRival(playerId: string, displayNames: Record<string, string>): boolean {
  const normalized = normalizePublicPlayerId(playerId);
  return Boolean(displayNames[normalized]?.trim());
}

export function subscribeRivalProfiles(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(RIVAL_PROFILES_CHANGED_EVENT, listener);
  return () => window.removeEventListener(RIVAL_PROFILES_CHANGED_EVENT, listener);
}
