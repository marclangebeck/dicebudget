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
} from "@/lib/tournamentTypes";
import { TournamentJoinScan } from "@/components/JoinByQrScan";

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
                {tournament.entries?.find((e) => e.id === joinedEntryId)
                  ?.displayName ?? displayName ?? "Spieler"}
              </strong>
              . Warte auf den Host — Partien folgen später.
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
            <p className="join-lobby-note">
              Das Ereignis läuft. Tische und Partien kommen mit dem nächsten
              Schritt — bitte die Liste gelegentlich aktualisieren.
            </p>
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
