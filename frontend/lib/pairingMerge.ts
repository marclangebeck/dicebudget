import { normalizePublicPlayerId } from "@/lib/playerIdentity";
import type {
  PairingDetailDto,
  PairingRoundDto,
  PairingSummaryDto,
} from "@/lib/pairingTypes";

/**
 * Lokales Zusammenführen von Paarungen (M22-konform, kein Backend, kein Klarname):
 * Spieler-IDs mit demselben lokalen Alias gelten als dieselbe Person. Die
 * pseudonymen Stats werden clientseitig zu einer Person zusammengefasst.
 */
export type MergedPairingSummary = PairingSummaryDto & {
  /** Backend-Keys der zusammengeführten Quell-Paarungen. */
  sourceKeys: string[];
};

/**
 * Kanonische Identität eines Spielers: gleicher Alias → "alias:<alias>" (hat
 * Vorrang, damit auch eigene Zweit-IDs mit demselben Alias zusammengeführt
 * werden), sonst eigener Spieler → "self", sonst die pseudonyme ID.
 */
function canonicalIdentity(
  playerId: string,
  aliases: Record<string, string> | undefined,
  ownId: string | undefined,
): string {
  const norm = normalizePublicPlayerId(playerId);
  const alias = aliases?.[norm]?.trim().toLowerCase();
  if (alias) return `alias:${alias}`;
  if (ownId && norm === normalizePublicPlayerId(ownId)) return "self";
  return `pid:${norm}`;
}

function isOwn(playerId: string, ownId: string | undefined): boolean {
  return (
    !!ownId &&
    normalizePublicPlayerId(playerId) === normalizePublicPlayerId(ownId)
  );
}

/** Reihenfolge-unabhängiger Schlüssel für ein zusammengeführtes Paar. */
function mergedKeyFor(canonA: string, canonB: string): string {
  return (
    "m:" + [encodeURIComponent(canonA), encodeURIComponent(canonB)].sort().join("|")
  );
}

function representative(playerId: string, ownId: string | undefined): string {
  return isOwn(playerId, ownId) ? ownId! : playerId;
}

function maxDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

export function isMergedPairingKey(key: string): boolean {
  return key.startsWith("m:");
}

/**
 * Fasst Paarungs-Übersichten anhand gleicher Aliase zusammen. Die Orientierung
 * (A/B) wird über die kanonischen Identitäten deterministisch festgelegt, damit
 * Quell-Paarungen mit vertauschten Seiten korrekt addiert werden.
 */
export function mergePairingSummaries(
  summaries: PairingSummaryDto[],
  aliases: Record<string, string> | undefined,
  ownId: string | undefined,
): MergedPairingSummary[] {
  const map = new Map<string, MergedPairingSummary>();

  for (const s of summaries) {
    const canonA = canonicalIdentity(s.playerA, aliases, ownId);
    const canonB = canonicalIdentity(s.playerB, aliases, ownId);
    const key = mergedKeyFor(canonA, canonB);
    // Quell-Seite A landet auf mergedB, wenn ihre Canon "größer" ist.
    const swap = canonA > canonB;
    const sideAId = swap ? s.playerB : s.playerA;
    const sideBId = swap ? s.playerA : s.playerB;
    const repA = representative(sideAId, ownId);
    const repB = representative(sideBId, ownId);

    let acc = map.get(key);
    if (!acc) {
      acc = {
        key,
        playerA: repA,
        playerB: repB,
        roundsPlayed: 0,
        appRoundsPlayed: 0,
        playerAWins: 0,
        playerBWins: 0,
        playerAAppWins: 0,
        playerBAppWins: 0,
        ties: 0,
        playerABonusPoints: 0,
        playerBBonusPoints: 0,
        playerATotalScore: 0,
        playerBTotalScore: 0,
        lastPlayedAt: null,
        sourceKeys: [],
      };
      map.set(key, acc);
    }

    // Eigene ID als Repräsentant bevorzugen, damit weiterhin „Du" angezeigt wird.
    if (isOwn(sideAId, ownId)) acc.playerA = ownId!;
    if (isOwn(sideBId, ownId)) acc.playerB = ownId!;

    acc.roundsPlayed += s.roundsPlayed;
    acc.appRoundsPlayed += s.appRoundsPlayed;
    acc.playerAWins += swap ? s.playerBWins : s.playerAWins;
    acc.playerBWins += swap ? s.playerAWins : s.playerBWins;
    acc.playerAAppWins += swap ? s.playerBAppWins : s.playerAAppWins;
    acc.playerBAppWins += swap ? s.playerAAppWins : s.playerBAppWins;
    acc.ties += s.ties;
    acc.playerABonusPoints += swap ? s.playerBBonusPoints : s.playerABonusPoints;
    acc.playerBBonusPoints += swap ? s.playerABonusPoints : s.playerBBonusPoints;
    acc.playerATotalScore += swap ? s.playerBTotalScore : s.playerATotalScore;
    acc.playerBTotalScore += swap ? s.playerATotalScore : s.playerBTotalScore;
    acc.lastPlayedAt = maxDate(acc.lastPlayedAt, s.lastPlayedAt);
    acc.sourceKeys.push(s.key);
  }

  return [...map.values()].sort((a, b) => {
    const da = a.lastPlayedAt ?? "";
    const db = b.lastPlayedAt ?? "";
    if (da !== db) return db.localeCompare(da);
    return b.roundsPlayed - a.roundsPlayed;
  });
}

/**
 * Fasst Detail-Paarungen (inkl. Runden) zusammen. Runden vertauschter
 * Quell-Seiten werden gespiegelt (Sieger A↔B, Scores), damit sie zur
 * gemeinsamen Orientierung passen.
 */
export function mergePairingDetails(
  details: PairingDetailDto[],
  aliases: Record<string, string> | undefined,
  ownId: string | undefined,
): PairingDetailDto | null {
  if (details.length === 0) return null;
  const base = mergePairingSummaries(details, aliases, ownId)[0];
  if (!base) return null;

  const rounds: PairingRoundDto[] = [];
  for (const d of details) {
    const canonA = canonicalIdentity(d.playerA, aliases, ownId);
    const canonB = canonicalIdentity(d.playerB, aliases, ownId);
    const swap = canonA > canonB;
    for (const r of d.rounds) {
      rounds.push(
        swap
          ? {
              ...r,
              playerAScore: r.playerBScore,
              playerBScore: r.playerAScore,
              winner: r.winner === "A" ? "B" : r.winner === "B" ? "A" : "tie",
            }
          : r,
      );
    }
  }
  rounds.sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""));

  return { ...base, rounds };
}
