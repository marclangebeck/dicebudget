import type { HomeRecordShareParams } from "@/lib/matchResultShare";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { normalizePublicPlayerId, playerLabel } from "@/lib/playerIdentity";
import type { PlayerAliasMap } from "@/lib/playerAliases";
import type { StatsDto } from "@/lib/statsTypes";

export type StatsOverview = {
  recordTitle: string;
  recordSummaryLabel: string;
  recordWinsLabel: string;
  recordLossesLabel: string;
  winShare: number;
  hasRecord: boolean;
  pairingCount: number;
  totalRounds: number;
  bestLabel: string;
  avgLabel: string;
  homeShareParams: HomeRecordShareParams;
};

export function buildStatsOverview(
  mergedPairings: PairingSummaryDto[],
  stats: StatsDto | null,
  ownPlayerId: string,
  aliases: PlayerAliasMap,
): StatsOverview {
  const totalRounds = mergedPairings.reduce((sum, pairing) => sum + pairing.roundsPlayed, 0);
  const bestLabel = stats?.bestTotalScore == null ? "Offen" : String(stats.bestTotalScore);
  const avgLabel =
    stats?.averageTotalScore == null ? "Bereit" : `${Math.round(stats.averageTotalScore)} Ø`;

  const ownPlayerNorm = ownPlayerId ? normalizePublicPlayerId(ownPlayerId) : "";
  const ownPlayerInPairings = mergedPairings.some(
    (pairing) =>
      normalizePublicPlayerId(pairing.playerA) === ownPlayerNorm ||
      normalizePublicPlayerId(pairing.playerB) === ownPlayerNorm,
  );
  const fallbackPerspective =
    mergedPairings
      .flatMap((pairing) => [pairing.playerA, pairing.playerB])
      .find((playerId) => aliases[normalizePublicPlayerId(playerId)]?.trim()) ?? "";
  const recordPerspectiveId = ownPlayerInPairings ? ownPlayerId : fallbackPerspective;
  const recordPerspectiveNorm = recordPerspectiveId
    ? normalizePublicPlayerId(recordPerspectiveId)
    : "";
  const recordTitle =
    recordPerspectiveId && !ownPlayerInPairings
      ? `${playerLabel(recordPerspectiveId, ownPlayerId, aliases)} Bilanz`
      : "Deine Bilanz";

  const ownRecord =
    recordPerspectiveNorm === ""
      ? null
      : mergedPairings.reduce(
          (record, pairing) => {
            if (normalizePublicPlayerId(pairing.playerA) === recordPerspectiveNorm) {
              record.wins += pairing.playerAWins;
              record.losses += pairing.playerBWins;
              record.ties += pairing.ties;
            } else if (normalizePublicPlayerId(pairing.playerB) === recordPerspectiveNorm) {
              record.wins += pairing.playerBWins;
              record.losses += pairing.playerAWins;
              record.ties += pairing.ties;
            }
            return record;
          },
          { wins: 0, losses: 0, ties: 0 },
        );

  const decidedRecordGames = ownRecord === null ? 0 : ownRecord.wins + ownRecord.losses;
  const winShare =
    ownRecord === null || decidedRecordGames === 0
      ? 50
      : Math.round((ownRecord.wins / decidedRecordGames) * 100);
  const hasRecord = ownRecord !== null && ownRecord.wins + ownRecord.losses + ownRecord.ties > 0;
  const recordSummaryLabel =
    hasRecord && ownRecord !== null ? `${ownRecord.wins}:${ownRecord.losses}` : "Offen";
  const recordWinsLabel = hasRecord && ownRecord !== null ? String(ownRecord.wins) : "—";
  const recordLossesLabel = hasRecord && ownRecord !== null ? String(ownRecord.losses) : "—";

  return {
    recordTitle,
    recordSummaryLabel,
    recordWinsLabel,
    recordLossesLabel,
    winShare,
    hasRecord,
    pairingCount: mergedPairings.length,
    totalRounds,
    bestLabel,
    avgLabel,
    homeShareParams: {
      recordTitle,
      wins: ownRecord?.wins ?? 0,
      losses: ownRecord?.losses ?? 0,
      ties: ownRecord?.ties ?? 0,
      bestScore: stats?.bestTotalScore ?? null,
      pairingGames: totalRounds,
    },
  };
}
