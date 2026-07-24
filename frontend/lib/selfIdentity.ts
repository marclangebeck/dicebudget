/**
 * Lokale „Das bin ich“-Zuordnung: Rivalen-Profil = eigene Person auf diesem Gerät.
 */

import { normalizePublicPlayerId } from "@/lib/playerIdentity";
import type { RivalProfile } from "@/lib/rivalProfiles";

const SELF_PROFILE_KEY = "dicebudget.selfRivalProfileId.v1";
export const SELF_IDENTITY_CHANGED_EVENT = "dicebudget:self-identity-changed";

export function loadSelfRivalProfileId(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(SELF_PROFILE_KEY)?.trim();
  return value || null;
}

export function setSelfRivalProfileId(profileId: string | null): void {
  if (typeof window === "undefined") return;
  if (!profileId) {
    window.localStorage.removeItem(SELF_PROFILE_KEY);
  } else {
    window.localStorage.setItem(SELF_PROFILE_KEY, profileId);
  }
  window.dispatchEvent(new Event(SELF_IDENTITY_CHANGED_EVENT));
}

export function subscribeSelfIdentity(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SELF_IDENTITY_CHANGED_EVENT, listener);
  return () => window.removeEventListener(SELF_IDENTITY_CHANGED_EVENT, listener);
}

/**
 * Alle Player-IDs, die auf diesem Gerät als „du“ gelten:
 * aktuelle Geräte-ID, gleicher Alias, Profil mit Geräte-ID, markiertes „Das bin ich“-Profil.
 */
export function resolveOwnPlayerIds(
  ownPlayerId: string,
  aliases: Record<string, string>,
  profiles: RivalProfile[],
  selfProfileId: string | null = loadSelfRivalProfileId(),
): Set<string> {
  const ids = new Set<string>();
  const own = normalizePublicPlayerId(ownPlayerId);
  if (own) ids.add(own);

  const ownAlias = aliases[own]?.trim().toLowerCase() ?? "";
  if (ownAlias) {
    for (const [id, name] of Object.entries(aliases)) {
      if (name.trim().toLowerCase() === ownAlias) {
        ids.add(normalizePublicPlayerId(id));
      }
    }
  }

  for (const profile of profiles) {
    const containsOwn = profile.playerIds.some(
      (id) => normalizePublicPlayerId(id) === own,
    );
    const isSelf = selfProfileId != null && profile.id === selfProfileId;
    if (!containsOwn && !isSelf) continue;
    for (const id of profile.playerIds) {
      ids.add(normalizePublicPlayerId(id));
    }
  }

  return ids;
}
