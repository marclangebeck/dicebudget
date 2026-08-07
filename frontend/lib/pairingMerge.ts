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
 * Gesamt-Siege per Max zusammengeführt und die Diff vom Override-Key
 * übernommen (Server liefert bei Absolut+Snapshot bereits fortgeschriebene Werte).
 * So bleibt der Zielstand geräteübergreifend konsistent — ohne Alias-Additiv-Drift.
 */
export function mergePairingSummaries(
  summaries: PairingSummaryDto[],
  aliases: Record<string, string> | undefined,
  ownId: string | undefined,
): MergedPairingSummary[] {
  const map = new Map<
    string,
    MergedPairingSummary & {
      _hasOverride: boolean;
      _maxWinsA: number;
      _maxWinsB: number;
      _overrideBonusA: number | null;
      _overrideBonusB: number | null;
      _overrideManualA: number | null;
      _overrideManualB: number | null;
    }
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
    const srcBonusA = swap ? s.playerBBonusPoints : s.playerABonusPoints;
    const srcBonusB = swap ? s.playerABonusPoints : s.playerBBonusPoints;
    const srcManualA = swap ? s.playerBManualBonus : s.playerAManualBonus;
    const srcManualB = swap ? s.playerAManualBonus : s.playerBManualBonus;
    const override =
      srcWinsA !== srcAppA ||
      srcWinsB !== srcAppB ||
      srcManualA > 0 ||
      srcManualB > 0;

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
        _overrideBonusA: null,
        _overrideBonusB: null,
        _overrideManualA: null,
        _overrideManualB: null,
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
    acc.playerABonusPoints += srcBonusA;
    acc.playerBBonusPoints += srcBonusB;
    acc.playerAManualBonus += srcManualA;
    acc.playerBManualBonus += srcManualB;
    acc.playerATotalScore += swap ? s.playerBTotalScore : s.playerATotalScore;
    acc.playerBTotalScore += swap ? s.playerATotalScore : s.playerBTotalScore;
    acc.lastPlayedAt = maxDate(acc.lastPlayedAt, s.lastPlayedAt);
    acc.sourceKeys.push(s.key);
    if (override) {
      acc._hasOverride = true;
      // Prefer the source with the strongest absolute/manual signal.
      const prevMag =
        (acc._overrideManualA ?? 0) + (acc._overrideManualB ?? 0);
      const nextMag = srcManualA + srcManualB;
      if (acc._overrideBonusA === null || nextMag >= prevMag) {
        acc._overrideBonusA = srcBonusA;
        acc._overrideBonusB = srcBonusB;
        acc._overrideManualA = srcManualA;
        acc._overrideManualB = srcManualB;
      }
    }
    acc._maxWinsA = Math.max(acc._maxWinsA, srcWinsA);
    acc._maxWinsB = Math.max(acc._maxWinsB, srcWinsB);
  }

  return [...map.values()]
    .map((acc) => {
      if (acc._hasOverride) {
        acc.playerAWins = Math.max(acc._maxWinsA, acc.playerAAppWins);
        acc.playerBWins = Math.max(acc._maxWinsB, acc.playerBAppWins);
        acc.roundsPlayed = acc.playerAWins + acc.playerBWins + acc.ties;
        if (acc._overrideBonusA !== null && acc._overrideBonusB !== null) {
          acc.playerABonusPoints = acc._overrideBonusA;
          acc.playerBBonusPoints = acc._overrideBonusB;
          acc.playerAManualBonus = acc._overrideManualA ?? 0;
          acc.playerBManualBonus = acc._overrideManualB ?? 0;
        }
      }
      const {
        _hasOverride: _a,
        _maxWinsA: _b,
        _maxWinsB: _c,
        _overrideBonusA: _d,
        _overrideBonusB: _e,
        _overrideManualA: _f,
        _overrideManualB: _g,
        ...rest
      } = acc;
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
 * Speichert ABSOLUTE Siege und ABSOLUTE Punktedifferenz (isAbsolute), damit
 * alle Geräte denselben Stand sehen — unabhängig vom lokalen Alias-Merge.
 * Das Backend speichert zusätzlich einen App-Snapshot und schreibt danach
 * neue App-Partien auf Siege und Diff fort (kein permanentes Einfrieren).
 * Diff wird als einseitiger Vorsprung gespeichert (A oder B), nicht „App-Netto + Extra“.
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

  const targetNet = Math.round(desired.netDiff);
  const absoluteBonusA = targetNet > 0 ? targetNet : 0;
  const absoluteBonusB = targetNet < 0 ? -targetNet : 0;

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
            extraBonusA: absoluteBonusB,
            extraBonusB: absoluteBonusA,
            isAbsolute: true,
          }
        : {
            key,
            extraWinsA: absoluteWinsA,
            extraWinsB: absoluteWinsB,
            extraBonusA: absoluteBonusA,
            extraBonusB: absoluteBonusB,
            isAbsolute: true,
          },
    );
  }

  return writes;
}
