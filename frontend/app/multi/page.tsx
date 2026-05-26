"use client";

import { useState } from "react";
import Link from "next/link";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { StrategyModeToggle } from "@/components/StrategyModeToggle";
import { createGameSession } from "@/lib/api";

export default function MultiHostPage() {
  const [gameCount, setGameCount] = useState(6);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [useStrategyRules, setUseStrategyRules] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [leagueCode, setLeagueCode] = useState<string | null>(null);
  const [createdStrategyMode, setCreatedStrategyMode] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const roomLocked = loading || !!inviteCode;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { session } = await createGameSession(gameCount, maxPlayers, useStrategyRules);
      setInviteCode(session.inviteCode);
      setLeagueCode(session.leagueCode);
      setCreatedStrategyMode(session.useStrategyRules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erstellung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="setup-host-screen pb-2">
      <AppScreenHeader
        section="Multiplayer"
        title="Raum erstellen"
        subtitle="Du bist Host – teile den Raum-Code mit deinen Mitspielern"
      />

      <form onSubmit={(e) => void handleCreate(e)} className="setup-host-form">
        <div className="setup-host-card setup-host-card--mode">
          <StrategyModeToggle
            useStrategyRules={useStrategyRules}
            onChange={setUseStrategyRules}
            disabled={roomLocked}
            variant="setup"
          />
        </div>

        <div className="setup-host-sliders">
          <label className="setup-slider-card setup-slider-card--sky">
            <span className="setup-slider-label">Spielanzahl</span>
            <span className="setup-slider-value tabular-nums">{gameCount}</span>
            <span className="setup-slider-hint">
              {gameCount === 1 ? "Spiel" : "Spiele"}
              {useStrategyRules && (
                <>
                  <br />
                  {gameCount * 13} Felder · max. {gameCount * 39} Würfe
                </>
              )}
            </span>
            <input
              type="range"
              min={1}
              max={6}
              value={gameCount}
              disabled={roomLocked}
              onChange={(e) => setGameCount(Number(e.target.value))}
              className="setup-host-range"
            />
          </label>

          <label className="setup-slider-card setup-slider-card--emerald">
            <span className="setup-slider-label">Mitspieler max.</span>
            <span className="setup-slider-value tabular-nums">{maxPlayers}</span>
            <span className="setup-slider-hint">2–6 Spieler</span>
            <input
              type="range"
              min={2}
              max={6}
              value={maxPlayers}
              disabled={roomLocked}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="setup-host-range"
            />
          </label>
        </div>

        {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

        {!inviteCode ? (
          <button
            type="submit"
            disabled={loading}
            className="setup-host-submit w-full disabled:opacity-50"
          >
            {loading ? "Erstelle …" : "Raum anlegen"}
          </button>
        ) : (
          <div className="setup-host-success">
            <p className="text-strong text-center text-sm font-semibold">Raum angelegt</p>
            <p className="setup-host-success-hint">
              Modus:{" "}
              <strong className="text-strong">
                {createdStrategyMode ? "Strategy Edition" : "DiceBudget Klassisch"}
              </strong>
            </p>

            <div>
              <p className="setup-host-code-label">Raum-Code für Gäste</p>
              <p className="setup-host-code">{inviteCode}</p>
            </div>

            {leagueCode && (
              <div>
                <p className="setup-host-code-label">Serie (Punkte laufen weiter)</p>
                <p className="setup-host-code setup-host-code--league">{leagueCode}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => void copyCode()}
              className="home-bento-submit home-bento-submit--lg w-full font-semibold"
            >
              {copied ? "Kopiert!" : "Code kopieren"}
            </button>

            <p className="setup-host-success-hint">
              Gäste: Startseite → Code eingeben oder „Raum beitreten“
            </p>

            <Link
              href={`/multi/join?code=${encodeURIComponent(inviteCode)}`}
              className="setup-host-submit flex w-full items-center justify-center no-underline"
            >
              Zur Lobby (auch als Host)
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
