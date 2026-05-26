"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { JoinByCodeForm } from "@/components/JoinByCodeForm";
import { getSessionLobby, getSessionRanking, joinSession, createGameSession } from "@/lib/api";
import { saveActiveGame } from "@/lib/activeGame";
import { ResumeLobbySheet } from "@/components/ResumeLobbySheet";
import type { SessionLobbyDto, SessionRankingDto } from "@/lib/sessionTypes";

function MultiJoinInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();

  const [lobby, setLobby] = useState<SessionLobbyDto | null>(null);
  const [ranking, setRanking] = useState<SessionRankingDto | null>(null);
  const [tab, setTab] = useState<"lobby" | "rank">("lobby");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextRoundLoading, setNextRoundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!code) return;
    setError(null);
    try {
      const [{ session: lob }, { session: rank }] = await Promise.all([
        getSessionLobby(code),
        getSessionRanking(code),
      ]);
      setLobby(lob);
      setRanking(rank);
      if (lob.allRunsFinished) setTab("rank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur bei Code aus URL
  }, [code]);

  async function handleNextRound() {
    if (!lobby) return;
    setNextRoundLoading(true);
    setError(null);
    try {
      const { session } = await createGameSession(
        lobby.gameCount,
        lobby.maxPlayers,
        lobby.useStrategyRules,
        lobby.leagueCode,
      );
      router.push(`/multi/join?code=${encodeURIComponent(session.inviteCode)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neue Runde fehlgeschlagen");
    } finally {
      setNextRoundLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { player } = await joinSession(code, name);
      saveActiveGame({
        type: "multi",
        runId: player.runId,
        playerSecret: player.secretToken,
        inviteCode: code,
      });
      router.push(
        `/play?runId=${encodeURIComponent(player.runId)}&invite=${encodeURIComponent(code)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beitreten fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  if (!code) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-link text-sm font-semibold">Multiplayer</p>
          <h1 className="text-2xl font-bold">Raum beitreten</h1>
          <p className="text-secondary text-sm">
            Code vom Host eingeben – du bleibst in der App.
          </p>
        </header>
        <JoinByCodeForm variant="inline" />
        <Link href="/multi" className="text-link text-sm">
          Stattdessen: Raum erstellen (Host)
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-link text-sm font-semibold">Multiplayer · Code {code}</p>
        <h1 className="text-2xl font-bold">Lobby</h1>
        <button
          type="button"
          onClick={() => void refresh()}
          className="btn-secondary w-fit px-3 py-1.5 text-sm"
        >
          Aktualisieren
        </button>
      </header>

      <ResumeLobbySheet inviteCode={code} />

      {error && (
        <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>
      )}

      {lobby && (
        <>
          <p className="text-secondary text-sm">
            {lobby.useStrategyRules ? "Strategy Edition" : "DiceBudget Klassisch"} ·{" "}
            {lobby.gameCount} Spiele · max. {lobby.maxPlayers} Spieler ·{" "}
            <span className="text-strong">{lobby.playerCount}</span> dabei · Runde{" "}
            <span className="text-accent tabular-nums font-medium">{lobby.roundNumber}</span> ·
            Status{" "}
            <span className="text-accent tabular-nums font-medium">{lobby.status}</span>
          </p>

          <p className="text-muted text-xs">
            Serie <strong className="text-strong font-mono">{lobby.leagueCode}</strong> · Gäste:
            Code <strong className="text-strong font-mono">{code}</strong> auf der Startseite
            eingeben.
          </p>

          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setTab("lobby")}
              className={`btn-chip px-3 py-1.5 ${tab === "lobby" ? "btn-chip-selected" : ""}`}
            >
              Mitspieler
            </button>
            <button
              type="button"
              onClick={() => setTab("rank")}
              className={`btn-chip px-3 py-1.5 ${tab === "rank" ? "btn-chip-selected" : ""}`}
            >
              Rangliste
            </button>
          </div>

          {tab === "lobby" && (
            <>
              <ul className="space-y-2">
                {lobby.players.map((p) => (
                  <li
                    key={p.id}
                    className="glass-stat flex justify-between px-3 py-2 text-sm"
                  >
                    <span>{p.name}</span>
                    <span className="text-muted tabular-nums">
                      {p.runFinished ? `${p.totalScore} ✓` : "spielt"}
                    </span>
                  </li>
                ))}
              </ul>

              {lobby.playerCount < lobby.maxPlayers && lobby.status !== "FINISHED" && (
                <form onSubmit={(e) => void handleJoin(e)} className="glass-panel flex flex-col gap-3 p-4">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-secondary">Dein Name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={40}
                      className="glass-input px-3 py-2"
                      required
                      placeholder="Name"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary py-3 disabled:opacity-50"
                  >
                    {loading ? "…" : "Zum Zettel – mitspielen"}
                  </button>
                </form>
              )}

              {lobby.playerCount >= lobby.maxPlayers && (
                <p className="text-sm font-medium text-amber-800">Alle Plätze belegt.</p>
              )}
            </>
          )}

          {tab === "rank" && ranking && (
            <>
              {ranking.winner && ranking.allRunsFinished && (
                <div className="glass-panel-emerald px-3 py-2 text-center text-sm">
                  <p className="text-accent font-semibold">
                    Gewinner Runde {ranking.roundNumber}: {ranking.winner.name} (
                    {ranking.winner.totalScore} Punkte)
                  </p>
                  <p className="text-muted mt-1 text-xs">
                    Ligapunkte: Sieger +1 Siegpunkt und Differenz zum Letztplatzierten als Bonus
                  </p>
                </div>
              )}

              <div>
                <h2 className="text-secondary mb-2 text-sm font-semibold">Diese Runde</h2>
                <ol className="space-y-2">
                  {ranking.ranking.map((row) => (
                    <li
                      key={row.name + String(row.rank)}
                      className="glass-stat flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="mr-2 text-slate-500">{row.rank}.</span>
                        {row.name}
                        {!row.finished && (
                          <span className="ml-2 text-xs text-slate-600">(noch aktiv)</span>
                        )}
                      </span>
                      <span className="text-strong font-semibold tabular-nums">
                        {row.totalScore}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {ranking.leagueStandings.length > 0 && (
                <div>
                  <h2 className="text-secondary mb-2 text-sm font-semibold">
                    Serie · {ranking.leagueCode}
                  </h2>
                  <ol className="space-y-2">
                    {ranking.leagueStandings.map((row) => (
                      <li
                        key={row.name + String(row.rank)}
                        className="glass-stat flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="mr-2 text-slate-500">{row.rank}.</span>
                          {row.name}
                        </span>
                        <span className="text-muted tabular-nums text-xs">
                          S {row.winPoints} · +{row.bonusPoints} ·{" "}
                          <strong className="text-strong text-sm">{row.totalPoints}</strong>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {ranking.status === "FINISHED" && ranking.pointsAwarded && (
                <button
                  type="button"
                  onClick={() => void handleNextRound()}
                  disabled={nextRoundLoading}
                  className="btn-primary w-full py-3 disabled:opacity-50"
                >
                  {nextRoundLoading ? "Starte …" : "Neue Runde in derselben Serie"}
                </button>
              )}
            </>
          )}
        </>
      )}

      <Link href="/multi" className="text-link text-sm">
        Neuer Raum (Host)
      </Link>
    </div>
  );
}

export default function MultiJoinPage() {
  return (
    <Suspense fallback={<p className="text-muted">Lade …</p>}>
      <MultiJoinInner />
    </Suspense>
  );
}
