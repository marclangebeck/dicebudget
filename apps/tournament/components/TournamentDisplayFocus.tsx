"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSessionRanking,
  type TournamentMatchDto,
} from "@/lib/api";
import type { SessionRankingDto } from "@/lib/sessionTypes";
import {
  formatMatchScore,
  matchStatusLabel,
  phaseLabel,
} from "@/lib/displayFormat";

const FOCUS_POLL_MS = 4_000;

type Props = {
  match: TournamentMatchDto;
  roundTitle: string;
  roundPhase: string;
  onBack: () => void;
};

function playerSessionScore(
  session: SessionRankingDto | null,
  playerId: string | null,
): number | null {
  if (!session || !playerId) return null;
  const player = session.players.find((p) => p.playerId === playerId);
  return player?.totalScore ?? null;
}

function playerRunFinished(
  session: SessionRankingDto | null,
  playerId: string | null,
): boolean | null {
  if (!session || !playerId) return null;
  const player = session.players.find((p) => p.playerId === playerId);
  return player?.runFinished ?? null;
}

export function TournamentDisplayFocus({
  match,
  roundTitle,
  roundPhase,
  onBack,
}: Props) {
  const [session, setSession] = useState<SessionRankingDto | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [lastLiveAt, setLastLiveAt] = useState<Date | null>(null);

  const sessionCode = match.sessionInviteCode ?? null;

  useEffect(() => {
    if (!sessionCode) {
      setSession(null);
      return;
    }

    const invite = sessionCode;
    let alive = true;

    async function poll() {
      try {
        const res = await getSessionRanking(invite);
        if (!alive) return;
        setSession(res.session);
        setSessionError(null);
        setLastLiveAt(new Date());
      } catch (e) {
        if (!alive) return;
        setSessionError(
          e instanceof Error ? e.message : "Live-Daten nicht verfügbar",
        );
      }
    }

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, FOCUS_POLL_MS);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [sessionCode]);

  const homeLive = playerSessionScore(session, match.homeEntry.playerId);
  const awayLive = playerSessionScore(session, match.awayEntry.playerId);

  const homeScore =
    match.status === "FINISHED" && match.homeScore != null
      ? match.homeScore
      : homeLive;
  const awayScore =
    match.status === "FINISHED" && match.awayScore != null
      ? match.awayScore
      : awayLive;

  const scoreText = formatMatchScore(homeScore, awayScore);
  const homeFinished = playerRunFinished(session, match.homeEntry.playerId);
  const awayFinished = playerRunFinished(session, match.awayEntry.playerId);

  const leader = useMemo(() => {
    if (homeScore == null || awayScore == null) return null;
    if (homeScore > awayScore) return "home";
    if (awayScore > homeScore) return "away";
    return "tie";
  }, [homeScore, awayScore]);

  const isLiveSession =
    Boolean(sessionCode) &&
    match.status !== "FINISHED" &&
    !(session?.allRunsFinished ?? false);

  const isTieBreak = Boolean(session?.koTieBreakPending);

  return (
    <section className="t-display-focus" aria-label="Paarung im Fokus">
      <div className="t-display-focus-toolbar">
        <button type="button" className="t-display-focus-back" onClick={onBack}>
          ← Gesamtübersicht
        </button>
        <div className="t-display-focus-toolbar-meta">
          <span className="t-display-focus-round">{roundTitle}</span>
          <span className="t-display-focus-phase">{phaseLabel(roundPhase)}</span>
        </div>
      </div>

      <div className="t-display-focus-hero">
        {isLiveSession ? (
          <span className="t-display-focus-live-badge">
            <span className="t-display-focus-live-dot" aria-hidden />
            Live
          </span>
        ) : null}

        <div className="t-display-focus-players">
          <article
            className={`t-display-focus-player${
              leader === "home" ? " t-display-focus-player--lead" : ""
            }`}
          >
            <p className="t-display-focus-player-name">
              {match.homeEntry.displayName}
            </p>
            <p className="t-display-focus-player-score tabular-nums">
              {homeScore ?? "—"}
            </p>
            {homeFinished === true ? (
              <p className="t-display-focus-player-state">Zettel fertig</p>
            ) : homeFinished === false && isLiveSession ? (
              <p className="t-display-focus-player-state">Spielt …</p>
            ) : null}
          </article>

          <div className="t-display-focus-center">
            <p className="t-display-focus-vs">vs</p>
            {scoreText ? (
              <p className="t-display-focus-scoreline tabular-nums">{scoreText}</p>
            ) : null}
            {leader === "tie" && homeScore != null ? (
              <p className="t-display-focus-lead-hint">Gleichstand</p>
            ) : null}
          </div>

          <article
            className={`t-display-focus-player t-display-focus-player--away${
              leader === "away" ? " t-display-focus-player--lead" : ""
            }`}
          >
            <p className="t-display-focus-player-name">
              {match.awayEntry.displayName}
            </p>
            <p className="t-display-focus-player-score tabular-nums">
              {awayScore ?? "—"}
            </p>
            {awayFinished === true ? (
              <p className="t-display-focus-player-state">Zettel fertig</p>
            ) : awayFinished === false && isLiveSession ? (
              <p className="t-display-focus-player-state">Spielt …</p>
            ) : null}
          </article>
        </div>

        <div className="t-display-focus-status-row">
          <span className="t-display-focus-status">
            {isTieBreak
              ? "KO-Tie-Break läuft"
              : matchStatusLabel(match.status, Boolean(match.sessionId))}
          </span>
          {sessionCode ? (
            <span className="t-display-focus-code tabular-nums">
              Session {sessionCode}
            </span>
          ) : null}
        </div>

        {sessionError ? (
          <p className="t-display-focus-error" role="alert">
            {sessionError}
          </p>
        ) : null}

        {lastLiveAt && isLiveSession ? (
          <p className="t-display-focus-live-meta">
            Live-Aktualisierung alle {FOCUS_POLL_MS / 1000}s · zuletzt{" "}
            {lastLiveAt.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        ) : null}
      </div>
    </section>
  );
}
