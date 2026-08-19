"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { getTournamentByInvite, type TournamentDto } from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import { findMatchInRounds, syncMatchInUrl } from "@/lib/displayMatch";
import {
  countLiveMatches,
  filterVisibleMatch,
  formatMatchScore,
  formatPoints,
  isByeEntry,
  matchStatusLabel,
  phaseLabel,
  sortRoundsForDisplay,
  tournamentStatusLabel,
} from "@/lib/displayFormat";
import { TOURNAMENT_MODE_OPTIONS } from "@/lib/tournamentModes";
import { TournamentDisplayFocus } from "@/components/TournamentDisplayFocus";

const REFRESH_MS = 20_000;

type Props = {
  inviteCode: string;
  initialFocusMatchId?: string | null;
};

function formatClock(date: Date): string {
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TournamentDisplayBoard({
  inviteCode,
  initialFocusMatchId = null,
}: Props) {
  const code = inviteCode.trim().toUpperCase();
  const [tournament, setTournament] = useState<TournamentDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const [focusMatchId, setFocusMatchId] = useState<string | null>(
    initialFocusMatchId,
  );

  const refresh = useCallback(async () => {
    if (!code) {
      setError("Kein Turnier-Code.");
      return;
    }
    setError(null);
    try {
      const res = await getTournamentByInvite(code);
      setTournament(res.tournament);
      setLastUpdated(new Date());

      if (res.tournament.status === "OPEN") {
        const site =
          process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
          "https://dicebudget.bottle-trade.de";
        const joinUrl = `${site}/tournament/join?code=${encodeURIComponent(code)}`;
        const dataUrl = await QRCode.toDataURL(joinUrl, {
          margin: 1,
          width: 520,
          color: { dark: "#0c1a2e", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
      } else {
        setQrDataUrl(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    }
  }, [code]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void refresh();
    }, REFRESH_MS);
    const clockTimer = window.setInterval(() => {
      setClock(new Date());
    }, 30_000);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [refresh]);

  useEffect(() => {
    setFocusMatchId(initialFocusMatchId);
  }, [initialFocusMatchId]);

  const modeLabel =
    TOURNAMENT_MODE_OPTIONS.find((option) => option.key === tournament?.modeKey)
      ?.label ?? tournament?.modeKey;

  const groups = tournament?.groups ?? [];
  const rounds = useMemo(
    () => sortRoundsForDisplay(tournament?.rounds ?? []),
    [tournament?.rounds],
  );
  const liveMatches = useMemo(() => countLiveMatches(rounds), [rounds]);

  const focused = useMemo(() => {
    if (!focusMatchId) return null;
    return findMatchInRounds(rounds, focusMatchId);
  }, [focusMatchId, rounds]);

  useEffect(() => {
    if (focusMatchId && !focused && tournament) {
      setFocusMatchId(null);
      syncMatchInUrl(null);
    }
  }, [focusMatchId, focused, tournament]);

  const registeredPlayers =
    tournament?.entries?.filter((entry) => entry.playerId != null) ?? [];

  const isOpen = tournament?.status === "OPEN";
  const isRunning = tournament?.status === "RUNNING";
  const isFinished = tournament?.status === "FINISHED";

  function focusMatch(matchId: string) {
    setFocusMatchId(matchId);
    syncMatchInUrl(matchId);
  }

  function clearFocus() {
    setFocusMatchId(null);
    syncMatchInUrl(null);
  }

  return (
    <main className="t-shell t-shell--display">
      <header className="t-display-head">
        <div className="t-display-head-main">
          <p className="t-display-kicker">
            {APP_NAME}
            {modeLabel ? ` · ${modeLabel}` : ""}
          </p>
          <h1 className="t-display-title">
            {tournament?.name?.trim() || "Ereignis"}
          </h1>
        </div>

        <div className="t-display-head-meta">
          {focused ? (
            <span className="t-display-badge t-display-badge--accent">
              Paarung im Fokus
            </span>
          ) : null}
          <span
            className={`t-display-badge${
              isRunning
                ? " t-display-badge--live"
                : isFinished
                  ? " t-display-badge--done"
                  : ""
            }`}
          >
            {tournamentStatusLabel(tournament?.status)}
          </span>
          {!focused && liveMatches > 0 ? (
            <span className="t-display-badge t-display-badge--accent">
              {liveMatches}{" "}
              {liveMatches === 1 ? "Match bereit" : "Matches bereit"}
            </span>
          ) : null}
          <span className="t-display-clock tabular-nums">{formatClock(clock)}</span>
        </div>
      </header>

      {error ? (
        <p className="t-display-error" role="alert">
          {error}
        </p>
      ) : null}

      {!tournament ? (
        <div className="t-display-loading">
          <p>Lade Anzeige …</p>
        </div>
      ) : isOpen ? (
        <section className="t-display-open">
          <div className="t-display-open-info">
            <p className="t-display-open-kicker">Anmeldung offen</p>
            <p className="t-display-open-code tabular-nums">{code}</p>
            <p className="t-display-open-count">
              {registeredPlayers.length}
              {tournament.maxEntries != null
                ? ` / ${tournament.maxEntries}`
                : ""}{" "}
              Spieler
            </p>
            <p className="t-display-open-hint">
              QR scannen in der DiceBudget-App — Teilnahme am Event.
            </p>
          </div>

          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="t-display-open-qr"
              src={qrDataUrl}
              alt={`QR für Event ${code}`}
            />
          ) : null}

          <div className="t-display-open-players">
            {registeredPlayers.length > 0 ? (
              registeredPlayers.map((entry) => (
                <div key={entry.id} className="t-display-player-chip">
                  {entry.displayName}
                </div>
              ))
            ) : (
              <p className="t-display-empty">Noch keine Anmeldungen.</p>
            )}
          </div>
        </section>
      ) : focused ? (
        <TournamentDisplayFocus
          match={focused.match}
          roundTitle={focused.roundTitle}
          roundPhase={focused.roundPhase}
          onBack={clearFocus}
        />
      ) : (
        <div className="t-display-grid">
          <section className="t-display-panel" aria-label="Tabellen">
            <h2 className="t-display-panel-title">Tabellen</h2>
            <div className="t-display-standings-wrap">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <article key={group.id} className="t-display-standings-card">
                    <h3 className="t-display-standings-name">{group.name}</h3>
                    {group.standings.length > 0 ? (
                      <table className="t-display-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Spieler</th>
                            <th>P</th>
                            <th>Diff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.standings
                            .filter((s) => !isByeEntry(s.entry))
                            .map((standing) => (
                              <tr key={standing.id}>
                                <td className="tabular-nums">
                                  {standing.rank > 0 ? standing.rank : "—"}
                                </td>
                                <td>{standing.entry.displayName}</td>
                                <td className="tabular-nums">
                                  {formatPoints(standing.points)}
                                </td>
                                <td
                                  className={`tabular-nums${
                                    standing.totalScoreDiff > 0
                                      ? " t-display-diff--pos"
                                      : standing.totalScoreDiff < 0
                                        ? " t-display-diff--neg"
                                        : ""
                                  }`}
                                >
                                  {standing.totalScoreDiff > 0 ? "+" : ""}
                                  {standing.totalScoreDiff}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="t-display-empty">
                        Tabelle startet nach dem ersten Match.
                      </p>
                    )}
                  </article>
                ))
              ) : (
                <p className="t-display-empty">
                  Tabellen erscheinen nach dem Start.
                </p>
              )}
            </div>
          </section>

          <section className="t-display-panel" aria-label="Spielplan">
            <h2 className="t-display-panel-title">
              Spielplan · Tippen für Live-Fokus
            </h2>
            <div className="t-display-rounds">
              {rounds.length > 0 ? (
                rounds.map((round) => {
                  const visibleMatches = round.matches.filter(filterVisibleMatch);
                  if (visibleMatches.length === 0) return null;

                  return (
                    <article key={round.id} className="t-display-round">
                      <header className="t-display-round-head">
                        <h3 className="t-display-round-title">{round.title}</h3>
                        <span className="t-display-round-phase">
                          {phaseLabel(round.phase)}
                        </span>
                      </header>

                      <ul className="t-display-matches">
                        {visibleMatches.map((match) => {
                          const score = formatMatchScore(
                            match.homeScore,
                            match.awayScore,
                          );
                          const isLive =
                            match.status === "READY" ||
                            Boolean(match.sessionInviteCode);
                          const isDone = match.status === "FINISHED";
                          const isFocused = focusMatchId === match.id;

                          return (
                            <li key={match.id}>
                              <button
                                type="button"
                                className={`t-display-match t-display-match--pick${
                                  isLive
                                    ? " t-display-match--live"
                                    : isDone
                                      ? " t-display-match--done"
                                      : ""
                                }${isFocused ? " t-display-match--focused" : ""}`}
                                onClick={() => focusMatch(match.id)}
                              >
                                <div className="t-display-match-players">
                                  <span className="t-display-match-name">
                                    {match.homeEntry.displayName}
                                  </span>
                                  <span className="t-display-match-score tabular-nums">
                                    {score ?? "vs"}
                                  </span>
                                  <span className="t-display-match-name t-display-match-name--away">
                                    {match.awayEntry.displayName}
                                  </span>
                                </div>

                                <div className="t-display-match-meta">
                                  <span className="t-display-match-status">
                                    {matchStatusLabel(
                                      match.status,
                                      Boolean(match.sessionId),
                                    )}
                                  </span>
                                  {match.sessionInviteCode ? (
                                    <span className="t-display-match-code tabular-nums">
                                      Code {match.sessionInviteCode}
                                    </span>
                                  ) : null}
                                  <span className="t-display-match-focus-hint">
                                    Fokus →
                                  </span>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </article>
                  );
                })
              ) : (
                <p className="t-display-empty">
                  Spielplan erscheint nach dem Start.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      <footer className="t-display-foot">
        <span className="t-display-foot-code tabular-nums">{code}</span>
        <span>
          {focused
            ? "Fokus-Modus · Live alle 4s"
            : lastUpdated
              ? `Aktualisiert ${formatClock(lastUpdated)} · alle ${REFRESH_MS / 1000}s`
              : "Lade …"}
        </span>
      </footer>
    </main>
  );
}
