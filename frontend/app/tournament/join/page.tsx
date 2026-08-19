"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getTournamentByInvite, joinTournament } from "@/lib/api";
import {
  loadActiveTournament,
  saveActiveTournament,
} from "@/lib/activeTournament";
import { getOrCreatePlayerId } from "@/lib/playerIdentity";
import { loadOwnDisplayName } from "@/lib/ownPlayerName";
import {
  tournamentModeLabel,
  tournamentStatusLabel,
  type TournamentDto,
  type TournamentGroupStandingDto,
  type TournamentMatchDto,
  type TournamentRoundDto,
} from "@/lib/tournamentTypes";
import { TournamentJoinScan } from "@/components/JoinByQrScan";

type PlayerMatchView = {
  round: TournamentRoundDto;
  match: TournamentMatchDto;
};

function phaseLabel(phase: string): string {
  if (phase === "LEAGUE") return "Liga";
  if (phase === "GROUP") return "Gruppenphase";
  if (phase === "KO") return "K.O.";
  if (phase === "KO_THIRD") return "Platz 3";
  return phase;
}

function roundPhaseOrder(phase: string): number {
  if (phase === "LEAGUE") return 0;
  if (phase === "GROUP") return 1;
  if (phase === "KO") return 2;
  if (phase === "KO_THIRD") return 3;
  return 4;
}

function isPlayerMatch(match: TournamentMatchDto, entryId: string): boolean {
  return match.homeEntry.id === entryId || match.awayEntry.id === entryId;
}

function flattenPlayerMatches(
  rounds: TournamentRoundDto[],
  entryId: string,
): PlayerMatchView[] {
  return rounds
    .slice()
    .sort(
      (a, b) =>
        roundPhaseOrder(a.phase) - roundPhaseOrder(b.phase) ||
        a.roundIndex - b.roundIndex ||
        a.legIndex - b.legIndex,
    )
    .flatMap((round) =>
      round.matches
        .filter((match) => isPlayerMatch(match, entryId))
        .map((match) => ({ round, match })),
    );
}

function formatMatchLine(match: TournamentMatchDto): string {
  return `${match.homeEntry.displayName} vs ${match.awayEntry.displayName}`;
}

function formatResult(match: TournamentMatchDto): string | null {
  if (match.homeScore == null || match.awayScore == null) return null;
  return `${match.homeScore} : ${match.awayScore}`;
}

function findRelevantStanding(
  tournament: TournamentDto,
  entryId: string,
): {
  title: string;
  standings: TournamentGroupStandingDto[];
  mine: TournamentGroupStandingDto | null;
} | null {
  const groups = tournament.groups ?? [];
  for (const group of groups) {
    const mine = group.standings.find((standing) => standing.entry.id === entryId) ?? null;
    if (mine) {
      return {
        title:
          tournament.modeKey === "league" && groups.length === 1 ? "Tabelle" : group.name,
        standings: group.standings,
        mine,
      };
    }
  }
  return null;
}

function TournamentJoinInner() {
  const searchParams = useSearchParams();
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();

  const [tournament, setTournament] = useState<TournamentDto | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedEntryId, setJoinedEntryId] = useState<string | null>(null);

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
    setDisplayName(loadOwnDisplayName());
    const saved = loadActiveTournament(code || undefined);
    if (saved) setJoinedEntryId(saved.entryId);
  }, [code]);

  const refresh = useCallback(async () => {
    if (!code) return;
    setError(null);
    try {
      const { tournament: next } = await getTournamentByInvite(code);
      setTournament(next);
      const mine =
        next.entries?.find((e) => e.playerId && e.playerId === playerId) ??
        null;
      if (mine) {
        setJoinedEntryId(mine.id);
        saveActiveTournament({
          inviteCode: code,
          tournamentId: next.id,
          entryId: mine.id,
          displayName: mine.displayName,
          playerId,
        });
      } else {
        const saved = loadActiveTournament(code);
        if (saved) setJoinedEntryId(saved.entryId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    }
  }, [code, playerId]);

  useEffect(() => {
    if (!code || !playerId) return;
    void refresh();
  }, [code, playerId, refresh]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code || !playerId) return;
    const name = (displayName ?? loadOwnDisplayName() ?? "").trim();
    if (name.length < 2) {
      setError("Bitte zuerst unter Einstellungen einen Spielernamen setzen.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await joinTournament(code, {
        displayName: name,
        playerId,
      });
      setTournament(res.tournament);
      setJoinedEntryId(res.entry.id);
      saveActiveTournament({
        inviteCode: code,
        tournamentId: res.tournament.id,
        entryId: res.entry.id,
        displayName: res.entry.displayName,
        playerId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Beitreten fehlgeschlagen";
      if (message.toLowerCase().includes("bereits")) {
        await refresh();
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!code) {
    return (
      <div className="join-lobby-shell">
        <header className="join-lobby-hero join-lobby-hero--code">
          <p className="join-lobby-kicker">Ereignis</p>
          <h1 className="join-lobby-title">Turnier/Liga beitreten</h1>
          <p className="join-lobby-subtitle">
            QR vom Host (DiceBudget Tournament) scannen — du bleibst in der App.
          </p>
        </header>
        <TournamentJoinScan variant="panel" />
        <Link href="/app" className="join-lobby-host-link">
          Zurück zum Start
        </Link>
      </div>
    );
  }

  const alreadyJoined = Boolean(joinedEntryId);
  const canJoin =
    tournament?.status === "OPEN" &&
    !alreadyJoined &&
    (tournament.entryCount ?? 0) < tournament.maxEntries;
  const myEntry =
    tournament?.entries?.find(
      (entry) =>
        entry.id === joinedEntryId ||
        (entry.playerId != null && entry.playerId === playerId),
    ) ?? null;
  const myMatches = tournament && myEntry ? flattenPlayerMatches(tournament.rounds ?? [], myEntry.id) : [];
  const liveMatch =
    myMatches.find(
      ({ match }) => match.status === "READY" || Boolean(match.sessionInviteCode),
    ) ?? null;
  const upcomingMatches = myMatches.filter(
    ({ match }) => match.status === "PENDING",
  );
  const completedMatches = myMatches.filter(
    ({ match }) => match.status === "FINISHED",
  );
  const standingView =
    tournament && myEntry ? findRelevantStanding(tournament, myEntry.id) : null;

  return (
    <div className="join-lobby-shell">
      <header className="join-lobby-hero">
        <p className="join-lobby-kicker">
          Ereignis · Code {code}
        </p>
        <h1 className="join-lobby-title">
          {tournament?.name?.trim() || "Ereignis-Lobby"}
        </h1>
        <button
          type="button"
          onClick={() => void refresh()}
          className="join-lobby-refresh"
        >
          Aktualisieren
        </button>
      </header>

      {error && (
        <p className="glass-alert-error px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      )}

      {tournament && (
        <>
          <section className="join-lobby-status">
            <span>
              <strong>{tournamentModeLabel(tournament.modeKey)}</strong>
              Format
            </span>
            <span>
              <strong>{tournamentStatusLabel(tournament.status)}</strong>
              Status
            </span>
            <span>
              <strong>
                {tournament.entryCount}/{tournament.maxEntries}
              </strong>
              Dabei
            </span>
          </section>

          {alreadyJoined && (
            <p className="join-lobby-note">
              Du bist angemeldet als{" "}
              <strong>
                {myEntry?.displayName ?? displayName ?? "Spieler"}
              </strong>
              . Dein Event-Status erscheint hier, sobald der Spielplan steht.
            </p>
          )}

          {!alreadyJoined && !displayName && (
            <p className="join-lobby-note">
              Für den Beitritt brauchst du einen{" "}
              <Link href="/settings" className="text-strong underline">
                Spielernamen
              </Link>
              .
            </p>
          )}

          <h2 className="text-secondary mb-2 text-sm font-semibold">Angemeldet</h2>
          <ul className="space-y-2">
            {(tournament.entries ?? []).length === 0 ? (
              <li className="join-lobby-note" style={{ margin: 0 }}>
                Noch niemand — du kannst der Erste sein.
              </li>
            ) : (
              (tournament.entries ?? [])
                .filter((entry) => entry.playerId != null)
                .map((entry) => {
                const isYou =
                  entry.id === joinedEntryId ||
                  (entry.playerId != null && entry.playerId === playerId);
                return (
                  <li key={entry.id} className="join-player-row">
                    <span>
                      {entry.displayName}
                      {isYou && (
                        <span className="ml-2 text-xs text-slate-400">(du)</span>
                      )}
                    </span>
                    <span className="join-player-state tabular-nums">
                      #{entry.orderIndex + 1}
                    </span>
                  </li>
                );
              })
            )}
          </ul>

          {canJoin && (
            <form onSubmit={(e) => void handleJoin(e)} className="join-action-card">
              <p className="text-secondary text-sm">
                Beitritt als{" "}
                <strong className="text-strong">{displayName}</strong>.
              </p>
              <button
                type="submit"
                disabled={loading || !displayName}
                className="btn-primary py-3 disabled:opacity-50"
              >
                {loading ? "…" : "Ereignis beitreten"}
              </button>
            </form>
          )}

          {tournament.status === "OPEN" &&
            !alreadyJoined &&
            tournament.entryCount >= tournament.maxEntries && (
              <p className="join-lobby-full">Alle Plätze belegt.</p>
            )}

          {tournament.status !== "OPEN" && !alreadyJoined && (
            <p className="join-lobby-full">
              Anmeldung geschlossen ({tournamentStatusLabel(tournament.status)}).
            </p>
          )}

          {tournament.status === "RUNNING" && alreadyJoined && (
            <>
              <section className="join-action-card">
                <p className="text-secondary text-sm font-semibold">
                  Dein Match-Fokus
                </p>
                {liveMatch ? (
                  <>
                    <p className="join-lobby-note" style={{ margin: 0 }}>
                      <strong>{liveMatch.round.title}</strong> ·{" "}
                      {phaseLabel(liveMatch.round.phase)}
                    </p>
                    <p className="join-player-match-title">
                      {formatMatchLine(liveMatch.match)}
                    </p>
                    {liveMatch.match.sessionInviteCode ? (
                      <>
                        <p className="join-player-match-code">
                          Session-Code {liveMatch.match.sessionInviteCode}
                        </p>
                        <Link
                          href={`/multi/join?code=${encodeURIComponent(
                            liveMatch.match.sessionInviteCode,
                          )}`}
                          className="btn-primary py-3 text-center"
                        >
                          Jetzt zur Partie
                        </Link>
                      </>
                    ) : (
                      <p className="join-lobby-note" style={{ margin: 0 }}>
                        Deine Paarung steht fest. Warte auf den Session-Code vom Host.
                      </p>
                    )}
                  </>
                ) : upcomingMatches.length > 0 ? (
                  <>
                    <p className="join-lobby-note" style={{ margin: 0 }}>
                      Deine nächste Partie ist geplant.
                    </p>
                    <p className="join-player-match-title">
                      {upcomingMatches[0] ? formatMatchLine(upcomingMatches[0].match) : "—"}
                    </p>
                    <p className="join-player-match-meta">
                      {upcomingMatches[0]?.round.title} ·{" "}
                      {phaseLabel(upcomingMatches[0]?.round.phase ?? "")}
                    </p>
                  </>
                ) : completedMatches.length > 0 ? (
                  <>
                    <p className="join-lobby-note" style={{ margin: 0 }}>
                      Deine Partien sind aktuell beendet.
                    </p>
                    <p className="join-player-match-title">
                      Letztes Ergebnis:{" "}
                      {formatMatchLine(completedMatches[completedMatches.length - 1]!.match)}
                    </p>
                    <p className="join-player-match-meta">
                      {formatResult(completedMatches[completedMatches.length - 1]!.match) ??
                        "gewertet"}
                    </p>
                  </>
                ) : (
                  <p className="join-lobby-note" style={{ margin: 0 }}>
                    Das Ereignis läuft. Dein erstes Match wird hier angezeigt, sobald es
                    für dich feststeht.
                  </p>
                )}
              </section>

              {standingView && (
                <section className="join-action-card">
                  <div className="join-player-section-head">
                    <p className="text-secondary text-sm font-semibold" style={{ margin: 0 }}>
                      {standingView.title}
                    </p>
                    <p className="join-player-rank">
                      Rang {standingView.mine?.rank || "—"}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {standingView.standings.map((standing) => {
                      const isYou = standing.entry.id === myEntry?.id;
                      return (
                        <li
                          key={standing.id}
                          className={`join-player-row${isYou ? " join-player-row--active" : ""}`}
                        >
                          <span>
                            {standing.rank > 0 ? `${standing.rank}. ` : ""}
                            {standing.entry.displayName}
                            {isYou ? (
                              <span className="ml-2 text-xs text-slate-300">(du)</span>
                            ) : null}
                          </span>
                          <span className="join-player-state tabular-nums">
                            {standing.points} P · Diff {standing.totalScoreDiff}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {myMatches.length > 0 && (
                <section className="join-action-card">
                  <p className="text-secondary text-sm font-semibold">
                    Deine Paarungen
                  </p>
                  <ul className="space-y-2">
                    {myMatches.map(({ round, match }) => (
                      <li key={match.id} className="join-player-row">
                        <span>
                          {round.title}: {formatMatchLine(match)}
                        </span>
                        <span className="join-player-state tabular-nums">
                          {match.status === "FINISHED"
                            ? formatResult(match) ?? "Beendet"
                            : match.sessionInviteCode
                              ? `Code ${match.sessionInviteCode}`
                              : tournamentStatusLabel(match.status)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {tournament.status === "FINISHED" && alreadyJoined && (
            <>
              <p className="join-lobby-note">
                Das Ereignis ist beendet. Hier siehst du deine Abschlusstabelle und
                alle gewerteten Paarungen.
              </p>
              {standingView && (
                <section className="join-action-card">
                  <div className="join-player-section-head">
                    <p className="text-secondary text-sm font-semibold" style={{ margin: 0 }}>
                      {standingView.title}
                    </p>
                    <p className="join-player-rank">
                      Rang {standingView.mine?.rank || "—"}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {standingView.standings.map((standing) => {
                      const isYou = standing.entry.id === myEntry?.id;
                      return (
                        <li
                          key={standing.id}
                          className={`join-player-row${isYou ? " join-player-row--active" : ""}`}
                        >
                          <span>
                            {standing.rank > 0 ? `${standing.rank}. ` : ""}
                            {standing.entry.displayName}
                          </span>
                          <span className="join-player-state tabular-nums">
                            {standing.points} P · Diff {standing.totalScoreDiff}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </>
          )}
        </>
      )}

      <Link href="/app" className="join-lobby-host-link">
        Zurück zum Start
      </Link>
    </div>
  );
}

export default function TournamentJoinPage() {
  return (
    <Suspense fallback={<p className="text-muted">Lade …</p>}>
      <div className="join-page-wrap">
        <TournamentJoinInner />
      </div>
    </Suspense>
  );
}
