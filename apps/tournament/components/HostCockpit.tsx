"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  createTournamentMatchSession,
  getTournamentByInvite,
  patchTournamentDraw,
  prepareTournamentDraw,
  releaseNextTournamentRound,
  shuffleTournamentDraw,
  startTournament,
  type DrawPreviewDto,
  type ScheduleMetaDto,
  type TournamentDto,
} from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import {
  formatMatchScore,
  matchStatusLabel,
  phaseLabel,
  tournamentStatusLabel,
} from "@/lib/displayFormat";
import { TOURNAMENT_MODE_OPTIONS } from "@/lib/tournamentModes";
import { clearHostSession, loadHostSession } from "@/lib/hostStore";
import {
  GENTLE_AUTO_REFRESH_MS,
  useGentleAutoRefresh,
} from "@/lib/useGentleAutoRefresh";

type Props = {
  inviteCode: string;
  onNewEvent: () => void;
  onSessionCleared: () => void;
};

export function HostCockpit({ inviteCode, onNewEvent, onSessionCleared }: Props) {
  const code = inviteCode.trim().toUpperCase();
  const [tournament, setTournament] = useState<TournamentDto | null>(null);
  const [drawPreview, setDrawPreview] = useState<DrawPreviewDto | null>(null);
  const [scheduleMeta, setScheduleMeta] = useState<ScheduleMetaDto | null>(null);
  const [collapsedWaves, setCollapsedWaves] = useState<Set<number>>(() => new Set());
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const host = loadHostSession();
  const hostToken =
    host && host.inviteCode === code ? host.hostToken : undefined;
  const isOpen = tournament?.status === "OPEN";
  const isRunning = tournament?.status === "RUNNING";
  const entryCount = tournament?.entryCount ?? 0;
  const maxEntries = tournament?.maxEntries;
  const groups = tournament?.groups ?? [];
  const rounds = tournament?.rounds ?? [];

  const roundsByWave = useMemo(() => {
    const map = new Map<number, typeof rounds>();
    for (const round of rounds) {
      const wave = round.releaseWave ?? 0;
      const bucket = map.get(wave) ?? [];
      bucket.push(round);
      map.set(wave, bucket);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [rounds]);

  useEffect(() => {
    if (!scheduleMeta || rounds.length === 0) return;
    const next = new Set<number>();
    for (const [wave, waveRounds] of roundsByWave) {
      if (wave >= scheduleMeta.releasedWave) continue;
      if (waveRounds.every((round) => round.matches.every((m) => m.status === "FINISHED"))) {
        next.add(wave);
      }
    }
    setCollapsedWaves(next);
  }, [scheduleMeta, rounds, roundsByWave]);

  async function onAssignPlayer(
    planRoundIndex: number,
    matchIndex: number,
    side: "home" | "away",
    entryId: string,
  ) {
    if (!tournament || !hostToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await patchTournamentDraw(tournament.id, hostToken, {
        planRoundIndex,
        matchIndex,
        assignPlayer: { planRoundIndex, matchIndex, side, entryId },
      });
      setDrawPreview(res.drawPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spielerwechsel fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  function toggleWaveCollapse(wave: number) {
    setCollapsedWaves((prev) => {
      const next = new Set(prev);
      if (next.has(wave)) next.delete(wave);
      else next.add(wave);
      return next;
    });
  }

  const applyTournamentResponse = useCallback(
    async (res: {
      tournament: TournamentDto;
      drawPreview?: DrawPreviewDto;
      scheduleMeta?: ScheduleMetaDto;
    }) => {
      setTournament(res.tournament);
      if (res.drawPreview) setDrawPreview(res.drawPreview);
      if (res.scheduleMeta) setScheduleMeta(res.scheduleMeta);
      setLastUpdated(new Date());

      if (res.tournament.status === "OPEN") {
        const site =
          process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
          "https://dicebudget.bottle-trade.de";
        const joinUrl = `${site}/tournament/join?code=${encodeURIComponent(code)}`;
        const dataUrl = await QRCode.toDataURL(joinUrl, {
          margin: 1,
          width: 420,
          color: { dark: "#0c1a2e", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
      } else {
        setQrDataUrl(null);
      }
    },
    [code],
  );

  const refresh = useCallback(
    async (options?: { silent?: boolean }): Promise<boolean> => {
      if (!code) {
        if (!options?.silent) setError("Kein Turnier-Code.");
        return false;
      }
      if (!options?.silent) setError(null);
      try {
        const res = await getTournamentByInvite(code, hostToken);
        await applyTournamentResponse(res);
        if (res.drawPreview) setDrawPreview(res.drawPreview);
        return true;
      } catch (e) {
        if (!options?.silent) {
          setError(e instanceof Error ? e.message : "Laden fehlgeschlagen");
        }
        return false;
      }
    },
    [applyTournamentResponse, code, hostToken],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const autoRefreshEnabled = Boolean(
    code && hostToken && (isOpen || isRunning || tournament?.status === "FINISHED"),
  );
  const { paused: autoRefreshPaused, effectiveIntervalMs } = useGentleAutoRefresh({
    enabled: autoRefreshEnabled,
    intervalMs: GENTLE_AUTO_REFRESH_MS,
    onRefresh: () => refresh({ silent: true }),
  });

  async function onPrepareDraw() {
    if (!tournament || !hostToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await prepareTournamentDraw(tournament.id, hostToken);
      await applyTournamentResponse(res);
      setDrawPreview(res.drawPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auslosung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function onShuffleDraw() {
    if (!tournament || !hostToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await shuffleTournamentDraw(tournament.id, hostToken);
      await applyTournamentResponse(res);
      setDrawPreview(res.drawPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Neu mischen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function onSwapPair(planRoundIndex: number, matchIndex: number) {
    if (!tournament || !hostToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await patchTournamentDraw(tournament.id, hostToken, {
        planRoundIndex,
        matchIndex,
        swapSides: true,
      });
      setDrawPreview(res.drawPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tausch fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function onStart() {
    if (!tournament || !hostToken) {
      setError("Nur der Host dieses Geräts kann das Turnier starten.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await startTournament(tournament.id, hostToken);
      await applyTournamentResponse(res);
      setDrawPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Start fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function onReleaseNextRound() {
    if (!tournament || !hostToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await releaseNextTournamentRound(tournament.id, hostToken);
      await applyTournamentResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rundenfreigabe fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateMatchSession(matchId: string) {
    if (!tournament || !hostToken) {
      setError("Nur der Host dieses Geräts kann Matches starten.");
      return;
    }
    setBusy(true);
    setActiveMatchId(matchId);
    setError(null);
    try {
      const res = await createTournamentMatchSession(tournament.id, matchId, hostToken);
      await applyTournamentResponse({ tournament: res.tournament });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Match-Session konnte nicht erstellt werden",
      );
    } finally {
      setBusy(false);
      setActiveMatchId(null);
    }
  }

  const modeLabel =
    TOURNAMENT_MODE_OPTIONS.find((option) => option.key === tournament?.modeKey)
      ?.label ?? tournament?.modeKey;

  return (
    <main className="t-shell t-shell--cockpit">
      <header className="t-cockpit-head">
        <p className="t-meta">
          {APP_NAME}
          {modeLabel ? ` · ${modeLabel}` : ""}
        </p>
        <h1 className="t-brand">
          {tournament?.name?.trim() || "Ereignis-Lobby"}
        </h1>
        <p className="t-meta">Drei Container — Beitritt · Feld · Leitung</p>
        <p className="t-meta">
          {tournamentStatusLabel(tournament?.status)}
          {" · "}
          {entryCount}
          {maxEntries != null ? ` / ${maxEntries}` : ""} Spieler
        </p>
        {autoRefreshEnabled && (
          <p className="t-auto-hint">
            {autoRefreshPaused
              ? `Auto-Update pausiert (nächster Versuch in ${Math.round(effectiveIntervalMs / 1000)} s)`
              : `Live · alle ${GENTLE_AUTO_REFRESH_MS / 1000} s${
                  lastUpdated
                    ? ` · zuletzt ${lastUpdated.toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""
                }`}
          </p>
        )}
      </header>

      <div className="t-cockpit-grid">
        <section className="t-card t-panel" aria-label="Beitritt">
          <p className="t-label">Beitritt</p>
          <div className="t-panel-body t-panel-join">
            <p className="t-code">{code || "—"}</p>
            {isOpen && qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="t-qr"
                src={qrDataUrl}
                alt={`QR für Ereignis ${code}`}
              />
            ) : null}
            <p className="t-meta">
              {isOpen
                ? "Teilnehmer scannen in der DiceBudget-App."
                : "Anmeldung geschlossen."}
            </p>
          </div>
        </section>

        <section className="t-card t-panel" aria-label="Feld">
          <p className="t-label">
            Feld · {entryCount}
            {maxEntries != null ? ` / ${maxEntries}` : ""}
          </p>
          <div className="t-panel-body">
            {tournament?.entries &&
            tournament.entries.filter((e) => e.playerId != null).length > 0 ? (
              <ul className="t-list">
                {tournament.entries
                  .filter((e) => e.playerId != null)
                  .map((entry) => (
                    <li key={entry.id}>
                      <span>{entry.displayName}</span>
                      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                        #{entry.orderIndex + 1}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="t-meta" style={{ margin: 0 }}>
                Noch keine Anmeldungen.
              </p>
            )}
          </div>
        </section>

        <section className="t-card t-panel" aria-label="Leitung">
          <p className="t-label">Leitung</p>
          <div className="t-panel-body">
            <p className="t-status">{tournamentStatusLabel(tournament?.status)}</p>
            <p className="t-meta">
              {isOpen
                ? "Auslosung vorbereiten, dann Ereignis starten."
                : isRunning && scheduleMeta
                  ? `Spielplan-Welle ${scheduleMeta.releasedWave}/${scheduleMeta.totalWaves} freigegeben`
                  : "Spielplan ist Datenbasis für Gruppen, Tabelle und Paarungen."}
            </p>
            {error && (
              <p className="t-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="t-panel-actions">
            <a
              href={`/display?code=${encodeURIComponent(code)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="t-btn t-btn--ghost"
            >
              Beamer-Ansicht
            </a>
            <button
              type="button"
              className="t-btn t-btn--ghost"
              onClick={() => void refresh()}
            >
              Aktualisieren
            </button>
            {isOpen && (
              <>
                <button
                  type="button"
                  className="t-btn t-btn--ghost"
                  disabled={busy || !hostToken || entryCount < 2}
                  onClick={() => void onPrepareDraw()}
                >
                  Auslosung vorbereiten
                </button>
                {drawPreview && (
                  <button
                    type="button"
                    className="t-btn t-btn--ghost"
                    disabled={busy || !hostToken}
                    onClick={() => void onShuffleDraw()}
                  >
                    Neu mischen
                  </button>
                )}
              </>
            )}
            {isRunning && scheduleMeta?.hasMoreRounds && (
              <button
                type="button"
                className="t-btn t-btn--ghost"
                disabled={busy || !hostToken}
                onClick={() => void onReleaseNextRound()}
              >
                Nächste Runde freigeben
              </button>
            )}
            <button
              type="button"
              className="t-btn t-btn--accent"
              disabled={busy || !hostToken || !isOpen}
              onClick={() => void onStart()}
            >
              {isOpen ? "Ereignis starten" : "Gestartet"}
            </button>
            <button type="button" className="t-btn t-btn--ghost" onClick={onNewEvent}>
              Neues Event
            </button>
            <button
              type="button"
              className="t-btn t-btn--ghost"
              onClick={() => {
                clearHostSession();
                onSessionCleared();
              }}
            >
              Host-Sitzung löschen
            </button>
          </div>
        </section>

        {isOpen && drawPreview && (
          <section className="t-card t-panel" aria-label="Auslosungsvorschau">
            <p className="t-label">Auslosungsvorschau</p>
            <div className="t-panel-body">
              <p className="t-meta" style={{ marginTop: 0 }}>
                {drawPreview.totalWaves} Spielplan-Wellen · Welle 1 startet mit dem
                Ereignis. Spieler per Dropdown tauschen oder Heim/Auswärts tauschen.
              </p>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                {drawPreview.rounds.map((round) => {
                  const entries =
                    drawPreview.groups.find(
                      (group) => group.sortOrder === round.groupSortOrder,
                    )?.entries ?? [];
                  return (
                  <div key={`${round.planRoundIndex}-${round.title}`} className="t-draw-round">
                    <p className="t-status" style={{ marginBottom: "0.35rem" }}>
                      {round.title}
                    </p>
                    <p className="t-meta" style={{ marginBottom: "0.5rem" }}>
                      {phaseLabel(round.phase)} · Welle {round.releaseWave}
                    </p>
                    <ul className="t-list">
                      {round.pairs.map((pair) => (
                        <li key={`${round.planRoundIndex}-${pair.matchIndex}`}>
                          <div className="t-draw-pair">
                            <div className="t-draw-slot-row">
                              <select
                                className="t-draw-select"
                                value={pair.homeEntryId}
                                disabled={busy}
                                onChange={(event) =>
                                  void onAssignPlayer(
                                    round.planRoundIndex,
                                    pair.matchIndex,
                                    "home",
                                    event.target.value,
                                  )
                                }
                              >
                                {entries.map((entry) => (
                                  <option key={entry.id} value={entry.id}>
                                    {entry.displayName}
                                  </option>
                                ))}
                              </select>
                              <span className="t-draw-vs">vs</span>
                              <select
                                className="t-draw-select"
                                value={pair.awayEntryId}
                                disabled={busy}
                                onChange={(event) =>
                                  void onAssignPlayer(
                                    round.planRoundIndex,
                                    pair.matchIndex,
                                    "away",
                                    event.target.value,
                                  )
                                }
                              >
                                {entries.map((entry) => (
                                  <option key={entry.id} value={entry.id}>
                                    {entry.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              className="t-btn t-btn--ghost"
                              disabled={busy}
                              onClick={() =>
                                void onSwapPair(round.planRoundIndex, pair.matchIndex)
                              }
                            >
                              Heim/Ausw. tauschen
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {!isOpen && (
          <section className="t-card t-panel" aria-label="Gruppen und Tabelle">
            <p className="t-label">Gruppen und Tabelle</p>
            <div className="t-panel-body">
              {groups.length > 0 ? (
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {groups.map((group) => (
                    <div key={group.id} className="t-subpanel">
                      <p className="t-status" style={{ marginBottom: "0.5rem" }}>
                        {group.name}
                      </p>
                      {group.standings.length > 0 ? (
                        <ul className="t-list">
                          {group.standings.map((standing) => (
                            <li key={standing.id}>
                              <span>
                                {standing.rank > 0 ? `${standing.rank}. ` : ""}
                                {standing.entry.displayName}
                              </span>
                              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                                {standing.points} P · Diff {standing.totalScoreDiff}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="t-meta" style={{ margin: 0 }}>
                          Tabelle startet nach dem ersten gewerteten Match.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="t-meta" style={{ margin: 0 }}>
                  Bei Liga eine Gesamttabelle, bei Turnier Gruppenübersichten.
                </p>
              )}
            </div>
          </section>
        )}

        {!isOpen && (
          <section className="t-card t-panel" aria-label="Spielpaarungen">
            <p className="t-label">Spielpaarungen</p>
            <div className="t-panel-body">
              {roundsByWave.length > 0 ? (
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {roundsByWave.map(([wave, waveRounds]) => {
                    const isCurrent = scheduleMeta?.releasedWave === wave;
                    const isCollapsed = collapsedWaves.has(wave);
                    const waveDone = waveRounds.every((round) =>
                      round.matches.every((match) => match.status === "FINISHED"),
                    );
                    return (
                      <div
                        key={`wave-${wave}`}
                        className={`t-subpanel${isCurrent ? " t-subpanel--current" : ""}`}
                      >
                        <button
                          type="button"
                          className="t-wave-head"
                          onClick={() => toggleWaveCollapse(wave)}
                        >
                          <span>
                            Welle {wave}
                            {isCurrent ? " · aktuell" : ""}
                            {waveDone ? " · abgeschlossen" : ""}
                          </span>
                          <span className="t-match-meta">
                            {isCollapsed ? "einblenden" : "einklappen"}
                          </span>
                        </button>
                        {!isCollapsed &&
                          waveRounds.map((round) => (
                            <div key={round.id} className="t-round-block">
                              <p className="t-status" style={{ marginBottom: "0.35rem" }}>
                                {round.title}
                              </p>
                              <p className="t-meta" style={{ marginBottom: "0.5rem" }}>
                                {phaseLabel(round.phase)}
                              </p>
                              <ul className="t-list">
                                {round.matches.map((match) => {
                                  const score = formatMatchScore(
                                    match.homeScore,
                                    match.awayScore,
                                  );
                                  const statusText = matchStatusLabel(
                                    match.status,
                                    Boolean(match.sessionInviteCode),
                                  );
                                  return (
                                    <li key={match.id}>
                                      <div className="t-match-row">
                                        <div className="t-match-main">
                                          <span>
                                            {match.homeEntry.displayName} vs{" "}
                                            {match.awayEntry.displayName}
                                          </span>
                                          <span className="t-match-meta">
                                            {score ?? statusText}
                                          </span>
                                        </div>
                                        <div className="t-match-actions">
                                          {match.sessionInviteCode ? (
                                            <span className="t-match-meta">
                                              Code {match.sessionInviteCode}
                                            </span>
                                          ) : null}
                                          {!match.sessionId ? (
                                            <button
                                              type="button"
                                              className="t-btn t-btn--ghost"
                                              disabled={
                                                busy ||
                                                match.homeEntry.playerId == null ||
                                                match.awayEntry.playerId == null
                                              }
                                              onClick={() =>
                                                void onCreateMatchSession(match.id)
                                              }
                                            >
                                              {busy && activeMatchId === match.id
                                                ? "Erzeuge…"
                                                : "Session starten"}
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="t-meta" style={{ margin: 0 }}>
                  Nach dem Start erscheinen hier freigegebene Runden.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
