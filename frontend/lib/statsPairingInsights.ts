import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { normalizePublicPlayerId } from "@/lib/playerIdentity";

export type PairingSortMode = "recent" | "closest" | "mostRounds";

export type PairingHighlightTone = "lead" | "chase" | "tie" | "even";

export type PairingHighlight = {
  badge: string | null;
  tone: PairingHighlightTone | null;
};

function winMargin(pairing: PairingSummaryDto): number {
  return Math.abs(pairing.playerAWins - pairing.playerBWins);
}

function parseTime(iso: string | null): number {
  if (!iso) return 0;
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : 0;
}

export function pickFeaturedPairingKey(pairings: PairingSummaryDto[]): string | null {
  if (pairings.length === 0) return null;
  const sorted = [...pairings].sort((a, b) => {
    if (b.roundsPlayed !== a.roundsPlayed) return b.roundsPlayed - a.roundsPlayed;
    return winMargin(a) - winMargin(b);
  });
  return sorted[0]?.key ?? null;
}

export function sortPairings(
  pairings: PairingSummaryDto[],
  mode: PairingSortMode,
): PairingSummaryDto[] {
  const list = [...pairings];
  switch (mode) {
    case "closest":
      return list.sort((a, b) => {
        const marginDiff = winMargin(a) - winMargin(b);
        if (marginDiff !== 0) return marginDiff;
        return b.roundsPlayed - a.roundsPlayed;
      });
    case "mostRounds":
      return list.sort((a, b) => {
        if (b.roundsPlayed !== a.roundsPlayed) return b.roundsPlayed - a.roundsPlayed;
        return parseTime(b.lastPlayedAt) - parseTime(a.lastPlayedAt);
      });
    case "recent":
    default:
      return list.sort((a, b) => parseTime(b.lastPlayedAt) - parseTime(a.lastPlayedAt));
  }
}

export function duelWinShare(pairing: PairingSummaryDto): number {
  const total = pairing.playerAWins + pairing.playerBWins;
  if (total <= 0) return 50;
  return Math.round((pairing.playerAWins / total) * 100);
}

export function getPairingHighlight(
  pairing: PairingSummaryDto,
  ownPlayerId: string,
  featuredKey: string | null,
): PairingHighlight & { featured: boolean } {
  const featured = featuredKey === pairing.key;
  const ownNorm = normalizePublicPlayerId(ownPlayerId);
  const isA = normalizePublicPlayerId(pairing.playerA) === ownNorm;
  const isB = normalizePublicPlayerId(pairing.playerB) === ownNorm;

  if (featured) {
    return { badge: "Top-Rivalität", tone: "even", featured: true };
  }

  if (!isA && !isB) {
    if (pairing.playerAWins === pairing.playerBWins && pairing.ties > 0) {
      return { badge: `${pairing.ties} Remis`, tone: "tie", featured: false };
    }
    return { badge: null, tone: null, featured: false };
  }

  const ownWins = isA ? pairing.playerAWins : pairing.playerBWins;
  const oppWins = isA ? pairing.playerBWins : pairing.playerAWins;
  const diff = ownWins - oppWins;

  if (diff > 0) {
    return { badge: `+${diff} vorn`, tone: "lead", featured: false };
  }
  if (diff < 0) {
    return { badge: `${diff} hinten`, tone: "chase", featured: false };
  }
  if (pairing.ties > 0) {
    return { badge: `${pairing.ties} Remis`, tone: "tie", featured: false };
  }
  return { badge: "Gleichstand", tone: "even", featured: false };
}
