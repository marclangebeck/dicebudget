"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPairingSummaries, getStats, resetPairings } from "@/lib/api";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { mergePairingSummaries, type MergedPairingSummary } from "@/lib/pairingMerge";
import { playerLabel } from "@/lib/playerIdentity";
import { PairingAccordionItem } from "@/components/PairingAccordionItem";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { StatsHeroPanel } from "@/components/StatsHeroPanel";
import { getOrCreatePlayerId, normalizePublicPlayerId } from "@/lib/playerIdentity";
import { loadDisplayNames, upsertRivalName } from "@/lib/rivalProfiles";
import { PlayerAliasOverlay } from "@/components/PlayerAliasOverlay";
import { PairingEditOverlay } from "@/components/PairingEditOverlay";
import { buildStatsOverview } from "@/lib/statsOverview";
import {
  duelWinShare,
  getPairingHighlight,
  pickFeaturedPairingKey,
  sortPairings,
  type PairingSortMode,
} from "@/lib/statsPairingInsights";
import type { StatsDto } from "@/lib/statsTypes";
import type { PlayerAliasMap } from "@/lib/playerAliases";

const SORT_OPTIONS: { id: PairingSortMode; label: string }[] = [
  { id: "recent", label: "Zuletzt" },
  { id: "closest", label: "Engste" },
  { id: "mostRounds", label: "Meiste Runden" },
];

function StatsPageInner() {
  const searchParams = useSearchParams();
  const deepLinkKey = (searchParams.get("pairing") ?? "").trim();

  const [pairings, setPairings] = useState<PairingSummaryDto[]>([]);
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [ownPlayerId, setOwnPlayerId] = useState("");
  const [aliases, setAliases] = useState<PlayerAliasMap>({});
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPairing, setEditingPairing] = useState<{
    group: MergedPairingSummary;
    sources: PairingSummaryDto[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<PairingSortMode>("recent");
  const [detailReloadToken, setDetailReloadToken] = useState(0);

  const refreshPairings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ pairings: data }, { stats: statsData }] = await Promise.all([
        getPairingSummaries(),
        getStats(),
      ]);
      setPairings(data);
      setStats(statsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Statistik nicht geladen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOwnPlayerId(getOrCreatePlayerId());
    setAliases(loadDisplayNames());
  }, []);

  useEffect(() => {
    void refreshPairings();
  }, [refreshPairings]);

  useEffect(() => {
    if (!deepLinkKey) return;
    setOpenKeys(new Set([deepLinkKey]));
  }, [deepLinkKey]);

  const mergedPairings = useMemo(
    () => mergePairingSummaries(pairings, aliases, ownPlayerId),
    [pairings, aliases, ownPlayerId],
  );

  const overview = useMemo(
    () => buildStatsOverview(mergedPairings, stats, ownPlayerId, aliases),
    [mergedPairings, stats, ownPlayerId, aliases],
  );

  const featuredKey = useMemo(
    () => pickFeaturedPairingKey(mergedPairings),
    [mergedPairings],
  );

  const sortedPairings = useMemo(
    () => sortPairings(mergedPairings, sortMode),
    [mergedPairings, sortMode],
  );

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedKeys(new Set());
  }, []);

  const toggleOpen = useCallback((key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
        "und betreffen alle Geräte. Ligapunkte in betroffenen Serien werden neu berechnet. " +
        "Das kann nicht rückgängig gemacht werden.",
    );
    if (!confirmed) return;

    const sourceKeys = [...new Set(chosen.flatMap((p) => p.sourceKeys))];
    setResetting(true);
    setError(null);
    setResetNotice(null);
    try {
      const result = await resetPairings(sourceKeys);
      let notice = `${result.deletedSessions} Runde(n) zurückgesetzt.`;
      if (result.leaguesRebuilt > 0) {
        notice += ` Ligapunkte in ${result.leaguesRebuilt} Serie(n) neu berechnet.`;
      }
      if (result.skippedMultiPlayer > 0) {
        notice += ` ${result.skippedMultiPlayer} Mehr-Spieler-Runde(n) wurden zum Schutz anderer Paarungen nicht gelöscht.`;
      }
      setResetNotice(notice);
      exitSelectMode();
      setOpenKeys(new Set());
      await refreshPairings();
      setDetailReloadToken((value) => value + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zurücksetzen fehlgeschlagen");
    } finally {
      setResetting(false);
    }
  }, [mergedPairings, selectedKeys, ownPlayerId, aliases, exitSelectMode, refreshPairings]);

  return (
    <div className="stats-screen flex flex-col gap-2.5 pb-2">
      <AppScreenHeader
        section="Statistik"
        title="Meine Rivalen"
        subtitle="Bilanz und Duelle — Rivalen tippen zum Benennen, Paarung zum Aufklappen"
      />

      <Link href="/settings?open=rivals" className="stats-rivals-manage-link">
        Rivalen verwalten
      </Link>

      {!loading && !error && mergedPairings.length > 0 && (
        <StatsHeroPanel overview={overview} />
      )}

      {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

      {resetNotice && (
        <p className="glass-alert-success px-3 py-2 text-sm">{resetNotice}</p>
      )}

      {!loading && !error && mergedPairings.length > 0 && (
        <>
          <div className="stats-sort-row" role="toolbar" aria-label="Paarungen sortieren">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`stats-sort-chip${sortMode === option.id ? " stats-sort-chip--active" : ""}`}
                aria-pressed={sortMode === option.id}
                onClick={() => setSortMode(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

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
        </>
      )}

      {loading && !error && (
        <p className="stats-empty-state">Lade Paarungen …</p>
      )}

      {!loading && !error && mergedPairings.length === 0 && (
        <div className="stats-empty-state stats-empty-state--cta">
          <p>Noch keine Paarungen. Spiele mindestens eine Multiplayer-Runde zu Ende.</p>
          <Link href="/multi" className="setup-host-submit mt-3 inline-flex min-h-10 items-center px-4 no-underline">
            Multi starten
          </Link>
        </div>
      )}

      {!loading && mergedPairings.length > 0 && (
        <ul className="stats-pairing-list">
          {sortedPairings.map((pairing) => {
            const highlight = getPairingHighlight(pairing, ownPlayerId, featuredKey);
            return (
              <PairingAccordionItem
                key={pairing.key}
                pairing={pairing}
                ownPlayerId={ownPlayerId}
                aliases={aliases}
                open={openKeys.has(pairing.key)}
                onToggle={() => toggleOpen(pairing.key)}
                onEditPlayerAlias={selectMode ? undefined : setEditingPlayerId}
                onEditPairing={selectMode ? undefined : setEditingPairing}
                selectable={selectMode}
                selected={selectedKeys.has(pairing.key)}
                onToggleSelect={() => toggleSelected(pairing.key)}
                badge={highlight.badge}
                badgeTone={highlight.tone}
                featured={highlight.featured}
                duelShareA={duelWinShare(pairing)}
                reloadToken={detailReloadToken}
              />
            );
          })}
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
            setAliases(upsertRivalName(editingPlayerId, alias));
            setEditingPlayerId(null);
            setDetailReloadToken((value) => value + 1);
          }}
        />
      )}

      {editingPairing && (
        <PairingEditOverlay
          merged={editingPairing.group}
          sourceSummaries={editingPairing.sources}
          ownPlayerId={ownPlayerId}
          aliases={aliases}
          onClose={() => setEditingPairing(null)}
          onSaved={() => {
            setEditingPairing(null);
            void refreshPairings();
            setDetailReloadToken((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<p className="stats-empty-state">Lade Paarungen …</p>}>
      <StatsPageInner />
    </Suspense>
  );
}
