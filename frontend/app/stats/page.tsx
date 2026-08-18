"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPairingSummaries, hasAdminApiKey, resetPairings } from "@/lib/api";
import { subscribeAdminAccess } from "@/lib/adminAccess";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { mergePairingSummaries, type MergedPairingSummary } from "@/lib/pairingMerge";
import { PairingAccordionItem } from "@/components/PairingAccordionItem";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import {
  getOrCreatePlayerId,
  normalizePublicPlayerId,
  playerLabel,
} from "@/lib/playerIdentity";
import {
  loadDisplayNames,
  loadRivalProfiles,
  subscribeRivalProfiles,
  type RivalProfile,
} from "@/lib/rivalProfiles";
import { PairingEditOverlay } from "@/components/PairingEditOverlay";
import {
  duelWinShare,
  sortPairings,
} from "@/lib/statsPairingInsights";
import type { PlayerAliasMap } from "@/lib/playerAliases";
import { playerIdsFromPairings } from "@/lib/displayNameMerge";
import { useMergedDisplayNames } from "@/lib/useMergedDisplayNames";
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

function StatsPageInner() {
  const searchParams = useSearchParams();
  const deepLinkKey = (searchParams.get("pairing") ?? "").trim();

  const [pairings, setPairings] = useState<PairingSummaryDto[]>([]);
  const [ownPlayerId, setOwnPlayerId] = useState("");
  const [aliases, setAliases] = useState<PlayerAliasMap>({});
  const displayAliases = useMergedDisplayNames(playerIdsFromPairings(pairings));
  const [rivalProfiles, setRivalProfiles] = useState<RivalProfile[]>([]);
  const [selfProfileId, setSelfProfileId] = useState<string | null>(null);
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
  const [detailReloadToken, setDetailReloadToken] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(hasAdminApiKey());
    return subscribeAdminAccess(() => setIsAdmin(hasAdminApiKey()));
  }, []);

  const refreshPairings = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    setError(null);
    try {
      const { pairings: data } = await getPairingSummaries();
      setPairings(data);
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

  const sortedPairings = useMemo(
    () => sortPairings(ownPairings, "recent"),
    [ownPairings],
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
          `${playerLabel(p.playerA, ownPlayerId, displayAliases)} vs. ${playerLabel(
            p.playerB,
            ownPlayerId,
            displayAliases,
          )}`,
      )
      .join("\n");
    const confirmed = window.confirm(
      `Folgende Paarungen hier ausblenden?\n\n${labels}\n\n` +
        "Nur auf diesem Gerät. " +
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
  }, [ownPairings, selectedKeys, ownPlayerId, displayAliases, exitSelectMode, isAdmin]);

  const handleServerResetSelected = useCallback(async () => {
    if (!isAdmin) return;
    const chosen = ownPairings.filter((p) => selectedKeys.has(p.key));
    if (chosen.length === 0) return;
    const labels = chosen
      .map(
        (p) =>
          `${playerLabel(p.playerA, ownPlayerId, displayAliases)} vs. ${playerLabel(
            p.playerB,
            ownPlayerId,
            displayAliases,
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
    displayAliases,
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
    <div className="settings-screen">
      <AppScreenHeader
        section="Statistik"
        title="Deine Duelle"
        subtitle="Paarungen — aufklappen für Foto und Details"
      />

      <div className="settings-list">
        {error && (
          <p className="glass-alert-error px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        )}

        {deleteNotice && (
          <p className="glass-alert-success px-3 py-2 text-sm">{deleteNotice}</p>
        )}

        <SettingsGroup title="Duelle">
          {loading && !error && (
            <p className="settings-group-pad settings-toggle-row-hint">Lade Paarungen …</p>
          )}
          {!loading && !error && ownPairings.length === 0 && (
            <div className="settings-group-pad">
              <p className="settings-toggle-row-hint">
                {manuallyHiddenCount > 0
                  ? "Keine sichtbaren Paarungen. Unter Verwalten kannst du Ausgeblendete wieder anzeigen."
                  : "Noch keine Paarungen. Spiele mindestens eine Multiplayer-Runde zu Ende."}
              </p>
              {manuallyHiddenCount === 0 && (
                <Link
                  href="/multi"
                  className="glass-button mt-2 inline-flex min-h-10 w-full items-center justify-center px-4 text-sm font-semibold no-underline"
                >
                  Multi starten
                </Link>
              )}
            </div>
          )}
          {!loading && ownPairings.length > 0 && (
            <>
              <p className="settings-group-caption settings-group-pad" style={{ paddingBottom: 0 }}>
                Namen vom Server, Fotos nur auf diesem Gerät.
                {foreignPairingCount > 0
                  ? ` ${foreignPairingCount === 1 ? "1 Paarung ohne dich ist" : `${foreignPairingCount} Paarungen ohne dich sind`} nur hier ausgeblendet.`
                  : ""}
                {!canFilterOwn && mergedPairings.length > 0
                  ? " Fremde Paarungen bleiben sichtbar, bis du in einem davon mitspielst."
                  : ""}
              </p>
              <ul className="stats-pairing-list">
                {sortedPairings.map((pairing) => (
                  <PairingAccordionItem
                    key={pairing.key}
                    pairing={pairing}
                    ownPlayerId={ownPlayerId}
                    aliases={displayAliases}
                    mergeAliases={aliases}
                    open={openKeys.has(pairing.key)}
                    onToggle={() => toggleOpen(pairing.key)}
                    onEditPairing={
                      selectMode || !isAdmin ? undefined : setEditingPairing
                    }
                    selectable={selectMode}
                    selected={selectedKeys.has(pairing.key)}
                    onToggleSelect={() => toggleSelected(pairing.key)}
                    duelShareA={duelWinShare(pairing)}
                    reloadToken={detailReloadToken}
                  />
                ))}
              </ul>
            </>
          )}
        </SettingsGroup>

        {(ownPairings.length > 0 || manuallyHiddenCount > 0) && (
          <SettingsGroup title="Verwalten">
            <div className="settings-group-pad">
              <p className="settings-toggle-row-hint">
                {isAdmin
                  ? "Aktualisieren, auswählen, Server löschen oder hier ausblenden."
                  : "Aktualisieren oder auf diesem Gerät ausblenden. Endgültig für alle nur der Admin."}
              </p>
              {!selectMode ? (
                <div className="stats-manage-actions">
                  {ownPairings.length > 0 && (
                    <>
                      <button
                        type="button"
                        className="glass-button min-h-10 flex-1 px-3 text-xs font-semibold"
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
                        className="glass-button min-h-10 flex-1 px-3 text-xs font-semibold"
                        onClick={() => {
                          setDeleteNotice(null);
                          setSelectMode(true);
                        }}
                      >
                        Auswählen
                      </button>
                    </>
                  )}
                  {manuallyHiddenCount > 0 && (
                    <button
                      type="button"
                      className="glass-button min-h-10 w-full px-3 text-xs font-semibold"
                      onClick={handleRestoreHidden}
                    >
                      {manuallyHiddenCount === 1
                        ? "1 ausgeblendete wieder anzeigen"
                        : `${manuallyHiddenCount} ausgeblendete wieder anzeigen`}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className="settings-toggle-row-hint mt-2">
                    {isAdmin
                      ? "Paarung(en) anhaken. Server-Löschen gilt für alle Geräte. Ausblenden nur hier."
                      : "Ausblenden gilt nur auf diesem Gerät."}
                  </p>
                  <div className="stats-manage-actions">
                    {isAdmin && (
                      <button
                        type="button"
                        className="glass-button min-h-10 flex-1 px-3 text-xs font-semibold disabled:opacity-50"
                        disabled={selectedKeys.size === 0 || deleting}
                        onClick={() => void handleServerResetSelected()}
                      >
                        {deleting
                          ? "Löschen …"
                          : `Server (${selectedKeys.size})`}
                      </button>
                    )}
                    <button
                      type="button"
                      className="glass-button min-h-10 flex-1 px-3 text-xs font-semibold disabled:opacity-50"
                      disabled={selectedKeys.size === 0 || deleting}
                      onClick={handleDeleteSelected}
                    >
                      {deleting
                        ? "…"
                        : `Ausblenden (${selectedKeys.size})`}
                    </button>
                    <button
                      type="button"
                      className="glass-button min-h-10 flex-1 px-3 text-xs font-semibold"
                      disabled={deleting}
                      onClick={() => {
                        exitSelectMode();
                      }}
                    >
                      Fertig
                    </button>
                  </div>
                </>
              )}
            </div>
          </SettingsGroup>
        )}
      </div>

      {editingPairing && (
        <PairingEditOverlay
          merged={editingPairing.group}
          sourceSummaries={editingPairing.sources}
          ownPlayerId={ownPlayerId}
          aliases={displayAliases}
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
    <Suspense fallback={<p className="settings-toggle-row-hint px-3">Lade Paarungen …</p>}>
      <StatsPageInner />
    </Suspense>
  );
}
