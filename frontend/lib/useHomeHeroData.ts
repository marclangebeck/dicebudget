"use client";

import { useEffect, useState } from "react";
import { getPairingSummaries, getStats } from "@/lib/api";
import {
  buildHomeRecordShareText,
  renderHomeRecordShareImage,
} from "@/lib/matchResultShare";
import { mergePairingSummaries } from "@/lib/pairingMerge";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { getOrCreatePlayerId } from "@/lib/playerIdentity";
import { loadDisplayNames } from "@/lib/rivalProfiles";
import type { PlayerAliasMap } from "@/lib/playerAliases";
import { buildStatsOverview } from "@/lib/statsOverview";
import type { StatsDto } from "@/lib/statsTypes";

export function useHomeHeroData() {
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [pairings, setPairings] = useState<PairingSummaryDto[] | null>(null);
  const [pairingsError, setPairingsError] = useState<string | null>(null);
  const [ownPlayerId, setOwnPlayerId] = useState("");
  const [aliases, setAliases] = useState<PlayerAliasMap>({});

  useEffect(() => {
    setOwnPlayerId(getOrCreatePlayerId());
    setAliases(loadDisplayNames());
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
  const overview =
    mergedPairings === null
      ? null
      : buildStatsOverview(mergedPairings, stats, ownPlayerId, aliases);

  const playedLabel =
    pairingsError !== null
      ? "—"
      : overview === null
        ? "..."
        : String(overview.totalRounds);

  return {
    playedLabel,
    bestLabel: overview?.bestLabel ?? "Offen",
    avgLabel: overview?.avgLabel ?? "Bereit",
    recordTitle: overview?.recordTitle ?? "Deine Bilanz",
    recordSummaryLabel: overview?.recordSummaryLabel ?? "Offen",
    recordWinsLabel: overview?.recordWinsLabel ?? "—",
    recordLossesLabel: overview?.recordLossesLabel ?? "—",
    winShare: overview?.winShare ?? 50,
    buildHomeShare: () =>
      buildHomeRecordShareText(
        overview?.homeShareParams ?? {
          recordTitle: "Deine Bilanz",
          wins: 0,
          losses: 0,
          ties: 0,
          bestScore: null,
          pairingGames: 0,
        },
      ),
    renderHomeShare: () =>
      renderHomeRecordShareImage(
        overview?.homeShareParams ?? {
          recordTitle: "Deine Bilanz",
          wins: 0,
          losses: 0,
          ties: 0,
          bestScore: null,
          pairingGames: 0,
        },
      ),
  };
}
