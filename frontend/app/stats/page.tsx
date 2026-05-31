"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPairingSummaries, resetPairings } from "@/lib/api";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { mergePairingSummaries } from "@/lib/pairingMerge";
import { playerLabel } from "@/lib/playerIdentity";
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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

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

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedKeys(new Set());
  }, []);

  const toggleSelected = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleReset = useCallback(async () => {
    const chosen = mergedPairings.filter((p) => selectedKeys.has(p.key));
    if (chosen.length === 0) return;
    const labels = chosen
      .map(
        (p) =>
          `${playerLabel(p.playerA, ownPlayerId, aliases)} vs. ${playerLabel(
            p.playerB,
            ownPlayerId,
            aliases,
          )}`,
      )
      .join("\n");
    const confirmed = window.confirm(
      `Folgende Paarungen wirklich endgültig zurücksetzen?\n\n${labels}\n\n` +
        "Die zugehörigen abgeschlossenen 2-Spieler-Runden werden serverseitig gelöscht " +
        "und betreffen alle Geräte. Das kann nicht rückgängig gemacht werden.",
    );
    if (!confirmed) return;

    const sourceKeys = [...new Set(chosen.flatMap((p) => p.sourceKeys))];
    setResetting(true);
    setError(null);
    setResetNotice(null);
    try {
      const result = await resetPairings(sourceKeys);
      let notice = `${result.deletedSessions} Runde(n) zurückgesetzt.`;
      if (result.skippedMultiPlayer > 0) {
        notice += ` ${result.skippedMultiPlayer} Mehr-Spieler-Runde(n) wurden zum Schutz anderer Paarungen nicht gelöscht.`;
      }
      setResetNotice(notice);
      exitSelectMode();
      await refreshPairings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zurücksetzen fehlgeschlagen");
    } finally {
      setResetting(false);
    }
  }, [mergedPairings, selectedKeys, ownPlayerId, aliases, exitSelectMode, refreshPairings]);

  return (
    <div className="stats-screen flex flex-col gap-3 pb-2">
      <AppScreenHeader
        section="Statistik"
        title="Paarungen"
        subtitle="Direkter Vergleich aus abgeschlossenen Multiplayer-Runden"
      />

      {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

      {resetNotice && (
        <p className="glass-alert-success px-3 py-2 text-sm">{resetNotice}</p>
      )}

      {!loading && !error && mergedPairings.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!selectMode ? (
            <button
              type="button"
              className="btn-chip px-3 py-1 text-xs"
              onClick={() => {
                setResetNotice(null);
                setSelectMode(true);
              }}
            >
              Statistik zurücksetzen
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-danger px-3 py-1 text-xs"
                disabled={selectedKeys.size === 0 || resetting}
                onClick={() => void handleReset()}
              >
                {resetting
                  ? "Wird zurückgesetzt …"
                  : `Ausgewählte zurücksetzen (${selectedKeys.size})`}
              </button>
              <button
                type="button"
                className="btn-chip px-3 py-1 text-xs"
                disabled={resetting}
                onClick={exitSelectMode}
              >
                Abbrechen
              </button>
            </>
          )}
        </div>
      )}

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
              onEditPlayerAlias={selectMode ? undefined : setEditingPlayerId}
              selectable={selectMode}
              selected={selectedKeys.has(pairing.key)}
              onToggleSelect={() => toggleSelected(pairing.key)}
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
