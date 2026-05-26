"use client";

import { useCallback, useEffect, useState } from "react";
import { getPairingSummaries } from "@/lib/api";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { NameMergePanel } from "@/components/NameMergePanel";
import { PairingSummaryCard } from "@/components/PairingSummaryCard";
import { AppScreenHeader } from "@/components/AppScreenHeader";

export default function StatsPage() {
  const [pairings, setPairings] = useState<PairingSummaryDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshPairings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { pairings: data } = await getPairingSummaries();
      setPairings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Statistik nicht geladen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPairings();
  }, [refreshPairings]);

  return (
    <div className="stats-screen flex flex-col gap-3 pb-2">
      <AppScreenHeader
        section="Statistik"
        title="Paarungen"
        subtitle="Direkter Vergleich aus abgeschlossenen Multiplayer-Runden"
      />

      {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

      {loading && !error && (
        <p className="stats-empty-state">Lade Paarungen …</p>
      )}

      {!loading && !error && pairings.length === 0 && (
        <p className="stats-empty-state">
          Noch keine Paarungen. Spiele mindestens eine Multiplayer-Runde mit zwei oder
          mehr Spielern zu Ende.
        </p>
      )}

      {!loading && pairings.length > 0 && (
        <ul className="stats-pairing-list">
          {pairings.map((pairing) => (
            <PairingSummaryCard key={pairing.key} pairing={pairing} />
          ))}
        </ul>
      )}

      <NameMergePanel onChanged={() => void refreshPairings()} variant="stats" />
    </div>
  );
}
