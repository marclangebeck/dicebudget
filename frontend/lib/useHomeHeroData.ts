"use client";

import { useEffect, useState } from "react";
import { getPairingSummaries, getStats } from "@/lib/api";
import {
  buildHomeRecordShareText,
  renderHomeRecordShareImage,
  type HomeRecordShareParams,
} from "@/lib/matchResultShare";
import { mergePairingSummaries } from "@/lib/pairingMerge";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { getOrCreatePlayerId, normalizePublicPlayerId, playerLabel } from "@/lib/playerIdentity";
import { loadPlayerAliases, type PlayerAliasMap } from "@/lib/playerAliases";
import type { StatsDto } from "@/lib/statsTypes";

export function useHomeHeroData() {
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [pairings, setPairings] = useState<PairingSummaryDto[] | null>(null);
  const [pairingsError, setPairingsError] = useState<string | null>(null);
  const [ownPlayerId, setOwnPlayerId] = useState("");
  const [aliases, setAliases] = useState<PlayerAliasMap>({});

  useEffect(() => {
    setOwnPlayerId(getOrCreatePlayerId());
    setAliases(loadPlayerAliases());
  }, []);

  useEffect(() => {
    void getStats()
      .then(({ stats: data }) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    void getPairingSummaries()
      .then(({ pairings: data }) => setPairings(data))
      .catch((e) =>
        setPairingsError(e instanceof Error ? e.message : "Paarungen nicht geladen"),
      );
  }, []);

  const mergedPairings =
    pairings === null ? null : mergePairingSummaries(pairings, aliases, ownPlayerId);
  const totalPairingRounds =
    mergedPairings === null
      ? null
      : mergedPairings.reduce((sum, pairing) => sum + pairing.roundsPlayed, 0);

  const playedLabel =
    pairingsError !== null ? "—" : totalPairingRounds === null ? "..." : String(totalPairingRounds);
  const bestLabel = stats?.bestTotalScore == null ? "Offen" : String(stats.bestTotalScore);
  const avgLabel =
    stats?.averageTotalScore == null ? "Bereit" : `${Math.round(stats.averageTotalScore)} Ø`;
  const ownPlayerNorm = ownPlayerId ? normalizePublicPlayerId(ownPlayerId) : "";
  const ownPlayerInPairings =
    mergedPairings?.some(
      (pairing) =>
        normalizePublicPlayerId(pairing.playerA) === ownPlayerNorm ||
        normalizePublicPlayerId(pairing.playerB) === ownPlayerNorm,
    ) ?? false;
  const fallbackPerspective =
    mergedPairings
      ?.flatMap((pairing) => [pairing.playerA, pairing.playerB])
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
    mergedPairings === null || recordPerspectiveNorm === ""
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
  const decidedRecordGames =
    ownRecord === null ? 0 : ownRecord.wins + ownRecord.losses;
  const winShare =
    ownRecord === null || decidedRecordGames === 0
      ? 50
      : Math.round((ownRecord.wins / decidedRecordGames) * 100);
  const hasOwnRecord = ownRecord !== null && ownRecord.wins + ownRecord.losses + ownRecord.ties > 0;
  const recordSummaryLabel =
    hasOwnRecord && ownRecord !== null ? `${ownRecord.wins}:${ownRecord.losses}` : "Offen";
  const recordWinsLabel = hasOwnRecord && ownRecord !== null ? String(ownRecord.wins) : "—";
  const recordLossesLabel = hasOwnRecord && ownRecord !== null ? String(ownRecord.losses) : "—";

  const homeShareParams: HomeRecordShareParams = {
    recordTitle,
    wins: ownRecord?.wins ?? 0,
    losses: ownRecord?.losses ?? 0,
    ties: ownRecord?.ties ?? 0,
    bestScore: stats?.bestTotalScore ?? null,
    pairingGames: totalPairingRounds,
  };

  return {
    playedLabel,
    bestLabel,
    avgLabel,
    recordTitle,
    recordSummaryLabel,
    recordWinsLabel,
    recordLossesLabel,
    winShare,
    buildHomeShare: () => buildHomeRecordShareText(homeShareParams),
    renderHomeShare: () => renderHomeRecordShareImage(homeShareParams),
  };
}
