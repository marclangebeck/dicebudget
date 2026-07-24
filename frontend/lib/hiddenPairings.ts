/**
 * Lokal ausgeblendete Paarungen (nur dieses Gerät).
 * Keys = Pairing-Keys bzw. merged Keys aus der Statistik.
 */

const STORAGE_KEY = "dicebudget.hiddenPairings.v1";
export const HIDDEN_PAIRINGS_CHANGED_EVENT = "dicebudget:hidden-pairings-changed";

function readKeys(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string" && value.length > 0);
  } catch {
    return [];
  }
}

function writeKeys(keys: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(keys)]));
  window.dispatchEvent(new Event(HIDDEN_PAIRINGS_CHANGED_EVENT));
}

export function loadHiddenPairingKeys(): Set<string> {
  return new Set(readKeys());
}

export function hidePairingKeys(keys: string[]): Set<string> {
  const next = [...loadHiddenPairingKeys(), ...keys];
  writeKeys(next);
  return new Set(next);
}

export function unhidePairingKey(key: string): Set<string> {
  const next = readKeys().filter((value) => value !== key);
  writeKeys(next);
  return new Set(next);
}

export function subscribeHiddenPairings(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(HIDDEN_PAIRINGS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(HIDDEN_PAIRINGS_CHANGED_EVENT, listener);
}

/** Paarung enthält die eigene öffentliche Player-ID nicht. */
export function pairingExcludesOwnPlayer(
  pairing: { playerA: string; playerB: string },
  ownPlayerId: string,
  normalize: (id: string) => string,
): boolean {
  if (!ownPlayerId) return false;
  const own = normalize(ownPlayerId);
  return normalize(pairing.playerA) !== own && normalize(pairing.playerB) !== own;
}
