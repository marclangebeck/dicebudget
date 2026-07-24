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

/** Paarung enthält mindestens eine der eigenen Player-IDs. */
export function pairingIncludesOwnIds(
  pairing: { playerA: string; playerB: string },
  ownIds: ReadonlySet<string>,
  normalize: (id: string) => string,
): boolean {
  if (ownIds.size === 0) return false;
  return (
    ownIds.has(normalize(pairing.playerA)) || ownIds.has(normalize(pairing.playerB))
  );
}

/**
 * Ob die Paarung dich enthält: Geräte-ID, Alias-Zweit-IDs oder „Das bin ich“-Profil.
 */
export function pairingIncludesOwnPlayer(
  pairing: { playerA: string; playerB: string },
  ownPlayerId: string,
  normalize: (id: string) => string,
  aliases: Record<string, string> = {},
  ownIds?: ReadonlySet<string>,
): boolean {
  if (ownIds) return pairingIncludesOwnIds(pairing, ownIds, normalize);
  if (!ownPlayerId) return true;
  const own = normalize(ownPlayerId);
  const ownAlias = aliases[own]?.trim().toLowerCase() ?? "";

  for (const side of [pairing.playerA, pairing.playerB]) {
    const id = normalize(side);
    if (id === own) return true;
    const sideAlias = aliases[id]?.trim().toLowerCase() ?? "";
    if (ownAlias && sideAlias && sideAlias === ownAlias) return true;
  }
  return false;
}

/** True, wenn mindestens eine Paarung zu den eigenen IDs passt. */
export function canFilterPairingsByOwnPlayer(
  pairings: { playerA: string; playerB: string }[],
  ownPlayerId: string,
  normalize: (id: string) => string,
  aliases: Record<string, string> = {},
  ownIds?: ReadonlySet<string>,
): boolean {
  if (ownIds) {
    return pairings.some((pairing) => pairingIncludesOwnIds(pairing, ownIds, normalize));
  }
  if (!ownPlayerId) return false;
  return pairings.some((pairing) =>
    pairingIncludesOwnPlayer(pairing, ownPlayerId, normalize, aliases),
  );
}

export function pairingExcludesOwnPlayer(
  pairing: { playerA: string; playerB: string },
  ownPlayerId: string,
  normalize: (id: string) => string,
  aliases: Record<string, string> = {},
  ownIds?: ReadonlySet<string>,
): boolean {
  if (ownIds) return !pairingIncludesOwnIds(pairing, ownIds, normalize);
  if (!ownPlayerId) return false;
  return !pairingIncludesOwnPlayer(pairing, ownPlayerId, normalize, aliases);
}
