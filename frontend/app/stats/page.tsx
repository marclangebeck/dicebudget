"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPairingSummaries, getStats, hasAdminApiKey, resetPairings } from "@/lib/api";
import { subscribeAdminAccess } from "@/lib/adminAccess";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { mergePairingSummaries, type MergedPairingSummary } from "@/lib/pairingMerge";
import { playerLabel } from "@/lib/playerIdentity";
import { PairingAccordionItem } from "@/components/PairingAccordionItem";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { StatsHeroPanel } from "@/components/StatsHeroPanel";
import { getOrCreatePlayerId, normalizePublicPlayerId } from "@/lib/playerIdentity";
import {
  loadDisplayNames,
  loadRivalProfiles,
  subscribeRivalProfiles,
  type RivalProfile,
} from "@/lib/rivalProfiles";
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
import {
  canFilterPairingsByOwnPlayer,
  clearHiddenPairingKeys,
  hidePairingKeys,
  keysToHideForPairing,
  loadHiddenPairingKeys,
  pairingExcludesOwnPlayer,
  pairingIsHidden,
  subscribeHiddenPairings,
} from "@/lib/hiddenPairings";
import {
  loadSelfRivalProfileId,
  resolveOwnPlayerIds,
  subscribeSelfIdentity,
} from "@/lib/selfIdentity";
import { useForegroundRefresh } from "@/lib/useForegroundRefresh";

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
  const [rivalProfiles, setRivalProfiles] = useState<RivalProfile[]>([]);
  const [selfProfileId, setSelfProfileId] = useState<string | null>(null);
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
  const [deleting, setDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set());
  const [sortMode, setSortMode] = useState<PairingSortMode>("recent");
  const [detailReloadToken, setDetailReloadToken] = useState(0);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(hasAdminApiKey());
    return subscribeAdminAccess(() => setIsAdmin(hasAdminApiKey()));
  }, []);

  const refreshPairings = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
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
      if (!opts?.quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOwnPlayerId(getOrCreatePlayerId());
    setAliases(loadDisplayNames());
    setRivalProfiles(loadRivalProfiles());
    setSelfProfileId(loadSelfRivalProfileId());
    setHiddenKeys(loadHiddenPairingKeys());
    const unsubRivals = subscribeRivalProfiles(() => {
      setRivalProfiles(loadRivalProfiles());
      setAliases(loadDisplayNames());
    });
    const unsubSelf = subscribeSelfIdentity(() => {
      setSelfProfileId(loadSelfRivalProfileId());
    });
    const unsubHidden = subscribeHiddenPairings(() => {
      setHiddenKeys(loadHiddenPairingKeys());
    });
    return () => {
      unsubRivals();
      unsubSelf();
      unsubHidden();
    };
  }, []);

  useEffect(() => {
    void refreshPairings();
  }, [refreshPairings]);

  useForegroundRefresh(() => {
    void refreshPairings({ quiet: true });
  });

  useEffect(() => {
    if (!deepLinkKey) return;
    setOpenKeys(new Set([deepLinkKey]));
  }, [deepLinkKey]);

  const mergedPairings = useMemo(
    () => mergePairingSummaries(pairings, aliases, ownPlayerId),
    [pairings, aliases, ownPlayerId],
  );

  const ownPlayerIds = useMemo(
    () =>
      resolveOwnPlayerIds(ownPlayerId, aliases, rivalProfiles, selfProfileId),
    [ownPlayerId, aliases, rivalProfiles, selfProfileId],
  );

  const canFilterOwn = useMemo(() => {
    // Explizit „Das bin ich“ → immer filtern (auch ohne aktuelle Geräte-ID in den Daten).
    if (selfProfileId) return true;
    return canFilterPairingsByOwnPlayer(
      mergedPairings,
      ownPlayerId,
      normalizePublicPlayerId,
      aliases,
      ownPlayerIds,
    );
  }, [mergedPairings, ownPlayerId, aliases, ownPlayerIds, selfProfileId]);

  /**
   * Fremde Paarungen ausblenden, sobald wir dich erkennen (Geräte-ID, Alias
   * oder Rivalen-Profil „Das bin ich“). Sonst alle anzeigen + Hinweis.
   * Manuell gelöschte Paarungen bleiben lokal ausgeblendet.
   */
  const ownPairings = useMemo(() => {
    const scoped =
      !ownPlayerId || !canFilterOwn
        ? mergedPairings
        : mergedPairings.filter(
            (pairing) =>
              !pairingExcludesOwnPlayer(
                pairing,
                ownPlayerId,
                normalizePublicPlayerId,
                aliases,
                ownPlayerIds,
              ),
          );
    return scoped.filter((pairing) => !pairingIsHidden(pairing, hiddenKeys));
  }, [mergedPairings, ownPlayerId, aliases, ownPlayerIds, canFilterOwn, hiddenKeys]);

  const foreignPairingCount = useMemo(() => {
    if (!ownPlayerId || !canFilterOwn) return 0;
    return mergedPairings.filter((pairing) =>
      pairingExcludesOwnPlayer(
        pairing,
        ownPlayerId,
        normalizePublicPlayerId,
        aliases,
        ownPlayerIds,
      ),
    ).length;
  }, [mergedPairings, ownPlayerId, aliases, ownPlayerIds, canFilterOwn]);

  const manuallyHiddenCount = useMemo(() => {
    const scoped =
      !ownPlayerId || !canFilterOwn
        ? mergedPairings
        : mergedPairings.filter(
            (pairing) =>
              !pairingExcludesOwnPlayer(
                pairing,
                ownPlayerId,
                normalizePublicPlayerId,
                aliases,
                ownPlayerIds,
              ),
          );
    return scoped.filter((pairing) => pairingIsHidden(pairing, hiddenKeys)).length;
  }, [mergedPairings, ownPlayerId, aliases, ownPlayerIds, canFilterOwn, hiddenKeys]);

  const overview = useMemo(
    () => buildStatsOverview(ownPairings, stats, ownPlayerId, aliases),
    [ownPairings, stats, ownPlayerId, aliases],
  );

  const featuredKey = useMemo(
    () => pickFeaturedPairingKey(ownPairings),
    [ownPairings],
  );

  const sortedPairings = useMemo(
    () => sortPairings(ownPairings, sortMode),
    [ownPairings, sortMode],
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

  const handleDeleteSelected = useCallback(() => {
    const chosen = ownPairings.filter((p) => selectedKeys.has(p.key));
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
      `Folgende Paarungen hier ausblenden?\n\n${labels}\n\n` +
        "Nur auf diesem Gerät. Rivalen bleiben erhalten. " +
        "Server-Daten und andere Geräte sind unverändert. " +
        "Du kannst ausgeblendete Paarungen später wieder anzeigen.",
    );
    if (!confirmed) return;

    if (isAdmin) {
      const adminOk = window.confirm(
        "Admin-Hinweis: Das ist keine globale Korrektur.\n\n" +
          "Andere Handys behalten die Paarung und die Zahlen unverändert.\n" +
          "Für gleiche Statistik überall: Abbrechen und „Server bereinigen“ " +
          "oder die Paarung tippen → Siege/Diff bearbeiten.\n\n" +
          "Trotzdem nur auf diesem Gerät ausblenden?",
      );
      if (!adminOk) return;
    }

    setDeleting(true);
    setError(null);
    setDeleteNotice(null);
    try {
      const keys = chosen.flatMap((pairing) => keysToHideForPairing(pairing));
      setHiddenKeys(hidePairingKeys(keys));
      setDeleteNotice(
        chosen.length === 1
          ? "1 Paarung nur auf diesem Gerät ausgeblendet (andere Geräte unverändert)."
          : `${chosen.length} Paarungen nur auf diesem Gerät ausgeblendet (andere Geräte unverändert).`,
      );
      exitSelectMode();
      setOpenKeys(new Set());
      setDetailReloadToken((value) => value + 1);
    } finally {
      setDeleting(false);
    }
  }, [ownPairings, selectedKeys, ownPlayerId, aliases, exitSelectMode, isAdmin]);

  const handleServerResetSelected = useCallback(async () => {
    if (!isAdmin) return;
    const chosen = ownPairings.filter((p) => selectedKeys.has(p.key));
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
      `ADMIN — Paarung(en) auf dem Server löschen?\n\n${labels}\n\n` +
        "Löscht abgeschlossene 2-Spieler-Runden und manuelle Baselines. " +
        "Danach sehen alle Handys dieselben Zahlen (nach Aktualisieren/App-Fokus). " +
        "Nicht rückgängig. „Ausblenden“ ersetzt das nicht.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    setDeleteNotice(null);
    try {
      const keys = chosen.flatMap((pairing) => keysToHideForPairing(pairing));
      const result = await resetPairings(keys);
      setDeleteNotice(
        `Gelöscht (Server, alle Geräte): ${result.deletedSessions} Session(s)` +
          (result.skippedMultiPlayer > 0
            ? `, ${result.skippedMultiPlayer} Mehrspieler-Sessions übersprungen`
            : "") +
          ". Andere Geräte: Statistik öffnen oder App in den Vordergrund holen.",
      );
      exitSelectMode();
      setOpenKeys(new Set());
      await refreshPairings();
      setDetailReloadToken((value) => value + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Server-Bereinigung fehlgeschlagen");
    } finally {
      setDeleting(false);
    }
  }, [
    isAdmin,
    ownPairings,
    selectedKeys,
    ownPlayerId,
    aliases,
    exitSelectMode,
    refreshPairings,
  ]);

  const handleRestoreHidden = useCallback(() => {
    if (manuallyHiddenCount === 0) return;
    const confirmed = window.confirm(
      `${manuallyHiddenCount === 1 ? "1 ausgeblendete Paarung" : `${manuallyHiddenCount} ausgeblendete Paarungen`} wieder in der Statistik anzeigen?`,
    );
    if (!confirmed) return;
    clearHiddenPairingKeys();
    setHiddenKeys(new Set());
    setDeleteNotice("Ausgeblendete Paarungen wieder sichtbar.");
  }, [manuallyHiddenCount]);

  return (
    <div className="stats-screen flex flex-col gap-2.5 pb-2">
      <AppScreenHeader
        section="Statistik"
        title="Meine Rivalen"
        subtitle="Bilanz und Duelle — Rivalen tippen zum Benennen, Paarung zum Aufklappen"
      />

      <Link href="/settings/rivals" className="stats-rivals-manage-link">
        Rivalen verwalten
      </Link>
      <p className="stats-foreign-filter-note">
        Namen und „Das bin ich“ gelten nur auf diesem Gerät.{" "}
        {isAdmin
          ? "Als Admin: Siege/Diff und „Server bereinigen“ gelten für alle Geräte. „Hier ausblenden“ nur lokal."
          : "Gemeinsame Zahlen kommen vom Server; Bereinigen und Siege nachtragen nur der Admin. „Hier ausblenden“ nur auf diesem Gerät."}
      </p>

      {isAdmin && (
        <p className="glass-alert-success px-3 py-2 text-xs leading-snug">
          <strong>Admin-Workflow (Stufe 0):</strong> Globale Korrektur über{" "}
          <strong>Verwalten → Auswählen</strong> und dann{" "}
          <strong>Löschen · Server</strong> oder Paarung tippen → Siege/Diff.
          „Ausblenden“ nie für Sync nutzen.
        </p>
      )}

      {foreignPairingCount > 0 && (
        <p className="stats-foreign-filter-note">
          {foreignPairingCount === 1
            ? "1 Paarung ohne dich ist nur hier ausgeblendet."
            : `${foreignPairingCount} Paarungen ohne dich sind nur hier ausgeblendet.`}
        </p>
      )}

      {!loading && !error && !canFilterOwn && mergedPairings.length > 0 && (
        <p className="stats-foreign-filter-note">
          Fremde Paarungen (z. B. Malte vs. Nicole) bleiben sichtbar, bis du unter{" "}
          <Link href="/settings/rivals">Rivalen</Link> bei dir „Das bin ich“ tippst.
        </p>
      )}

      {!loading && !error && ownPairings.length > 0 && (
        <StatsHeroPanel overview={overview} />
      )}

      {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

      {deleteNotice && (
        <p className="glass-alert-success px-3 py-2 text-sm">{deleteNotice}</p>
      )}

      {!loading && !error && (ownPairings.length > 0 || manuallyHiddenCount > 0) && (
        <>
          {ownPairings.length > 0 && (
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
          )}

          <div className="stats-tools">
            <button
              type="button"
              className={`stats-tools-toggle${toolsOpen || selectMode ? " is-open" : ""}`}
              aria-expanded={toolsOpen || selectMode}
              onClick={() => {
                if (selectMode) {
                  exitSelectMode();
                  setToolsOpen(false);
                  return;
                }
                setToolsOpen((open) => !open);
              }}
            >
              <span>Verwalten</span>
              <span className="stats-tools-toggle-chevron" aria-hidden>
                {toolsOpen || selectMode ? "▾" : "▸"}
              </span>
            </button>

            {(toolsOpen || selectMode) && (
              <div className="stats-tools-panel" role="group" aria-label="Statistik verwalten">
                {!selectMode ? (
                  <>
                    {ownPairings.length > 0 && (
                      <>
                        <button
                          type="button"
                          className="btn-chip px-3 py-1.5 text-xs"
                          onClick={() => {
                            setDeleteNotice(null);
                            void refreshPairings({ quiet: true });
                            setDeleteNotice("Statistik aktualisiert.");
                          }}
                        >
                          Aktualisieren
                        </button>
                        <button
                          type="button"
                          className="btn-chip px-3 py-1.5 text-xs"
                          onClick={() => {
                            setDeleteNotice(null);
                            setSelectMode(true);
                          }}
                        >
                          {isAdmin ? "Auswählen · korrigieren / löschen" : "Paarungen auswählen"}
                        </button>
                      </>
                    )}
                    {manuallyHiddenCount > 0 && (
                      <button
                        type="button"
                        className="btn-chip px-3 py-1.5 text-xs"
                        onClick={handleRestoreHidden}
                      >
                        {manuallyHiddenCount === 1
                          ? "1 ausgeblendete wieder anzeigen"
                          : `${manuallyHiddenCount} ausgeblendete wieder anzeigen`}
                      </button>
                    )}
                    {ownPairings.length === 0 && manuallyHiddenCount === 0 && (
                      <p className="stats-foreign-filter-note mb-0">Keine Aktionen verfügbar.</p>
                    )}
                  </>
                ) : (
                  <>
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-danger px-3 py-1.5 text-xs"
                        disabled={selectedKeys.size === 0 || deleting}
                        onClick={() => void handleServerResetSelected()}
                      >
                        {deleting
                          ? "Löschen …"
                          : `Löschen · Server, alle Geräte (${selectedKeys.size})`}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-chip px-3 py-1.5 text-xs"
                      disabled={selectedKeys.size === 0 || deleting}
                      onClick={handleDeleteSelected}
                    >
                      {deleting
                        ? "Wird ausgeblendet …"
                        : `Ausblenden · nur dieses Gerät (${selectedKeys.size})`}
                    </button>
                    <button
                      type="button"
                      className="btn-chip px-3 py-1.5 text-xs"
                      disabled={deleting}
                      onClick={() => {
                        exitSelectMode();
                        setToolsOpen(true);
                      }}
                    >
                      Abbrechen
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {selectMode && (
            <p className="stats-foreign-filter-note">
              {isAdmin ? (
                <>
                  Paarung(en) anhaken. <strong>Löschen · Server</strong> entfernt sie für alle
                  Geräte. Oder eine Paarung tippen → Siege/Diff setzen. „Ausblenden“ gilt nur
                  hier.
                </>
              ) : (
                <>
                  „Ausblenden“ = nur dieses Handy. Endgültig für alle: Admin →{" "}
                  <strong>Löschen · Server</strong>.
                </>
              )}
            </p>
          )}
        </>
      )}

      {loading && !error && (
        <p className="stats-empty-state">Lade Paarungen …</p>
      )}

      {!loading && !error && ownPairings.length === 0 && (
        <div className="stats-empty-state stats-empty-state--cta">
          <p>
            {manuallyHiddenCount > 0
              ? "Keine sichtbaren Paarungen. Du kannst ausgeblendete Paarungen wieder anzeigen."
              : "Noch keine Paarungen. Spiele mindestens eine Multiplayer-Runde zu Ende."}
          </p>
          {manuallyHiddenCount === 0 && (
            <Link href="/multi" className="setup-host-submit mt-3 inline-flex min-h-10 items-center px-4 no-underline">
              Multi starten
            </Link>
          )}
        </div>
      )}

      {!loading && ownPairings.length > 0 && (
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
                onEditPairing={
                  selectMode || !isAdmin ? undefined : setEditingPairing
                }
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
          onSave={(displayNames) => {
            setAliases(displayNames);
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
