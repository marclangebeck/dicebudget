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
 *
 * Hat mindestens eine Quelle einen Baseline-Override (Wins ≠ App-Wins), werden
 * Gesamt-Siege per Max zusammengeführt — sonst würde ein absoluter Zielstand
 * geräteabhängig zu App-Siegen anderer Keys addiert.
 */
export function mergePairingSummaries(
  summaries: PairingSummaryDto[],
  aliases: Record<string, string> | undefined,
  ownId: string | undefined,
): MergedPairingSummary[] {
  const map = new Map<
    string,
    MergedPairingSummary & { _hasOverride: boolean; _maxWinsA: number; _maxWinsB: number }
  >();

  for (const s of summaries) {
    const canonA = canonicalIdentity(s.playerA, aliases, ownId);
    const canonB = canonicalIdentity(s.playerB, aliases, ownId);
    const key = mergedKeyFor(canonA, canonB);
    const swap = canonA > canonB;
    const sideAId = swap ? s.playerB : s.playerA;
    const sideBId = swap ? s.playerA : s.playerB;
    const repA = representative(sideAId, ownId);
    const repB = representative(sideBId, ownId);

    const srcWinsA = swap ? s.playerBWins : s.playerAWins;
    const srcWinsB = swap ? s.playerAWins : s.playerBWins;
    const srcAppA = swap ? s.playerBAppWins : s.playerAAppWins;
    const srcAppB = swap ? s.playerAAppWins : s.playerBAppWins;
    const override = srcWinsA !== srcAppA || srcWinsB !== srcAppB;

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
        playerAManualBonus: 0,
        playerBManualBonus: 0,
        playerATotalScore: 0,
        playerBTotalScore: 0,
        lastPlayedAt: null,
        sourceKeys: [],
        _hasOverride: false,
        _maxWinsA: 0,
        _maxWinsB: 0,
      };
      map.set(key, acc);
    }

    if (isOwn(sideAId, ownId)) acc.playerA = ownId!;
    if (isOwn(sideBId, ownId)) acc.playerB = ownId!;

    acc.roundsPlayed += s.roundsPlayed;
    acc.appRoundsPlayed += s.appRoundsPlayed;
    acc.playerAWins += srcWinsA;
    acc.playerBWins += srcWinsB;
    acc.playerAAppWins += srcAppA;
    acc.playerBAppWins += srcAppB;
    acc.ties += s.ties;
    acc.playerABonusPoints += swap ? s.playerBBonusPoints : s.playerABonusPoints;
    acc.playerBBonusPoints += swap ? s.playerABonusPoints : s.playerBBonusPoints;
    acc.playerAManualBonus += swap ? s.playerBManualBonus : s.playerAManualBonus;
    acc.playerBManualBonus += swap ? s.playerAManualBonus : s.playerBManualBonus;
    acc.playerATotalScore += swap ? s.playerBTotalScore : s.playerATotalScore;
    acc.playerBTotalScore += swap ? s.playerATotalScore : s.playerBTotalScore;
    acc.lastPlayedAt = maxDate(acc.lastPlayedAt, s.lastPlayedAt);
    acc.sourceKeys.push(s.key);
    if (override) acc._hasOverride = true;
    acc._maxWinsA = Math.max(acc._maxWinsA, srcWinsA);
    acc._maxWinsB = Math.max(acc._maxWinsB, srcWinsB);
  }

  return [...map.values()]
    .map((acc) => {
      if (acc._hasOverride) {
        acc.playerAWins = Math.max(acc._maxWinsA, acc.playerAAppWins);
        acc.playerBWins = Math.max(acc._maxWinsB, acc.playerBAppWins);
        acc.roundsPlayed = acc.playerAWins + acc.playerBWins + acc.ties;
      }
      const { _hasOverride: _, _maxWinsA: __, _maxWinsB: ___, ...rest } = acc;
      return rest;
    })
    .sort((a, b) => {
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

/** Ein Schreibauftrag für die serverseitige manuelle Baseline (Backend-Key). */
export type PairingBaselineWrite = {
  key: string;
  extraWinsA: number;
  extraWinsB: number;
  extraBonusA: number;
  extraBonusB: number;
  /** Absoluter Zielstand (nicht Additiv) — für geräteübergreifenden Sync. */
  isAbsolute: boolean;
};

export type DesiredPairingTotals = {
  /** Gewünschte Gesamt-Siege Spieler A (inkl. App-Runden). */
  totalWinsA: number;
  totalWinsB: number;
  /** Netto-Punktedifferenz: positiv = zugunsten A, negativ = zugunsten B. */
  netDiff: number;
};

/**
 * Übersetzt gewünschte Gesamtwerte in Baseline-Schreibaufträge.
 * Speichert ABSOLUTE Siege (isAbsolute), damit alle Geräte denselben Stand
 * sehen — unabhängig vom lokalen Alias-Merge.
 * App-Siege bleiben die UI-Untergrenze. Differenz-Boni bleiben additiv zum App-Netto.
 * Volle Absolute-Siege landen auf einem Repräsentanten-Key; andere Keys der Gruppe → 0.
 */
export function buildBaselineWrites(
  merged: MergedPairingSummary,
  sourceSummaries: PairingSummaryDto[],
  aliases: Record<string, string> | undefined,
  ownId: string | undefined,
  desired: DesiredPairingTotals,
): PairingBaselineWrite[] {
  const appWinsA = merged.playerAAppWins;
  const appWinsB = merged.playerBAppWins;
  const absoluteWinsA = Math.max(appWinsA, Math.round(desired.totalWinsA));
  const absoluteWinsB = Math.max(appWinsB, Math.round(desired.totalWinsB));

  const currentManualNet = merged.playerAManualBonus - merged.playerBManualBonus;
  const totalNet = merged.playerABonusPoints - merged.playerBBonusPoints;
  const appNet = totalNet - currentManualNet;
  const newManualNet = Math.round(desired.netDiff) - appNet;
  const manualBonusA = newManualNet > 0 ? newManualNet : 0;
  const manualBonusB = newManualNet < 0 ? -newManualNet : 0;

  const sortedKeys = [...merged.sourceKeys].sort();
  const repKey = sortedKeys[0];
  const writes: PairingBaselineWrite[] = [];

  for (const key of sortedKeys) {
    const src = sourceSummaries.find((s) => s.key === key);
    if (!src) continue;
    if (key !== repKey) {
      writes.push({
        key,
        extraWinsA: 0,
        extraWinsB: 0,
        extraBonusA: 0,
        extraBonusB: 0,
        isAbsolute: true,
      });
      continue;
    }
    const swap =
      canonicalIdentity(src.playerA, aliases, ownId) >
      canonicalIdentity(src.playerB, aliases, ownId);
    writes.push(
      swap
        ? {
            key,
            extraWinsA: absoluteWinsB,
            extraWinsB: absoluteWinsA,
            extraBonusA: manualBonusB,
            extraBonusB: manualBonusA,
            isAbsolute: true,
          }
        : {
            key,
            extraWinsA: absoluteWinsA,
            extraWinsB: absoluteWinsB,
            extraBonusA: manualBonusA,
            extraBonusB: manualBonusB,
            isAbsolute: true,
          },
    );
  }

  return writes;
}
