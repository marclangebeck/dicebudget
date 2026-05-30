"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPairingSummaries } from "@/lib/api";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { mergePairingSummaries } from "@/lib/pairingMerge";
import { PairingSummaryCard } from "@/components/PairingSummaryCard";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { getOrCreatePlayerId, normalizePublicPlayerId } from "@/lib/playerIdentity";
import { loadPlayerAliases, setPlayerAlias, type PlayerAliasMap } from "@/lib/playerAliases";
import { PlayerAliasOverlay } from "@/components/PlayerAliasOverlay";

export default function StatsPage() {
  const [pairings, setPairings] = useState<PairingSummaryDto[]>([]);
  const [ownPlayerId, setOwnPlayerId] = useState("");
  const [aliases, setAliases] = useState<PlayerAliasMap>({});
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
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
    setOwnPlayerId(getOrCreatePlayerId());
    setAliases(loadPlayerAliases());
  }, []);

  useEffect(() => {
    void refreshPairings();
  }, [refreshPairings]);

  // Gleicher Alias = dieselbe Person → Paarungen lokal zusammenführen.
  const mergedPairings = useMemo(
    () => mergePairingSummaries(pairings, aliases, ownPlayerId),
    [pairings, aliases, ownPlayerId],
  );

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

      {!loading && !error && mergedPairings.length === 0 && (
        <p className="stats-empty-state">
          Noch keine Paarungen. Spiele mindestens eine Multiplayer-Runde mit zwei oder
          mehr Spielern zu Ende.
        </p>
      )}

      {!loading && mergedPairings.length > 0 && (
        <ul className="stats-pairing-list">
          {mergedPairings.map((pairing) => (
            <PairingSummaryCard
              key={pairing.key}
              pairing={pairing}
              ownPlayerId={ownPlayerId}
              aliases={aliases}
              onEditPlayerAlias={setEditingPlayerId}
            />
          ))}
        </ul>
      )}

      {editingPlayerId && (
        <PlayerAliasOverlay
          playerId={editingPlayerId}
          ownPlayerId={ownPlayerId}
          aliases={aliases}
          currentAlias={aliases[normalizePublicPlayerId(editingPlayerId)]}
          onClose={() => setEditingPlayerId(null)}
          onSave={(alias) => {
            setAliases(setPlayerAlias(editingPlayerId, alias));
            setEditingPlayerId(null);
          }}
        />
      )}
    </div>
  );
}
