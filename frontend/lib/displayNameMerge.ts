import { getPlayerDisplayNames } from "@/lib/api";
import type { PlayerAliasMap } from "@/lib/playerAliases";
import { normalizePublicPlayerId } from "@/lib/playerIdentity";
import { ownNameAliasOverlay } from "@/lib/ownPlayerName";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { loadDisplayNames } from "@/lib/rivalProfiles";

const MAX_LOOKUP_IDS = 64;

/**
 * Nur Anzeige. Nicht an mergePairingSummaries / resolveOwnPlayerIds geben —
 * sonst würden gleiche Servernamen fremde playerIds zusammenführen.
 */
export function overlayDisplayNames(
  local: PlayerAliasMap,
  server: PlayerAliasMap,
): PlayerAliasMap {
  const serverNorm: PlayerAliasMap = {};
  for (const [id, name] of Object.entries(server)) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    serverNorm[normalizePublicPlayerId(id)] = trimmed;
  }
  return { ...local, ...serverNorm, ...ownNameAliasOverlay() };
}

export function playerIdsFromPairings(pairings: PairingSummaryDto[]): string[] {
  const ids = new Set<string>();
  for (const pairing of pairings) {
    if (pairing.playerA) ids.add(normalizePublicPlayerId(pairing.playerA));
    if (pairing.playerB) ids.add(normalizePublicPlayerId(pairing.playerB));
  }
  return [...ids];
}

export async function loadMergedDisplayNames(
  extraIds: string[] = [],
): Promise<PlayerAliasMap> {
  const local = loadDisplayNames();
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const raw of [...extraIds, ...Object.keys(local)]) {
    const id = normalizePublicPlayerId(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_LOOKUP_IDS) break;
  }
  try {
    const { names } = await getPlayerDisplayNames(ids);
    return overlayDisplayNames(local, names);
  } catch {
    return overlayDisplayNames(local, {});
  }
}
