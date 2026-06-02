"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { BonusCelebrationToggle } from "@/components/BonusCelebrationToggle";
import { StrategyModeToggle } from "@/components/StrategyModeToggle";
import { createGameSession, joinSession } from "@/lib/api";
import { saveActiveGame } from "@/lib/activeGame";
import { setPlayerAlias } from "@/lib/playerAliases";
import {
  createTableModePlayerId,
  saveTableModeSession,
  type TableModePlayer,
} from "@/lib/tableMode";

export default function MultiHostPage() {
  const router = useRouter();
  const [gameCount, setGameCount] = useState(6);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [useStrategyRules, setUseStrategyRules] = useState(true);
  const [showOpponentPool, setShowOpponentPool] = useState(false);
  const [poolEndgameEnabled, setPoolEndgameEnabled] = useState(false);
  const [tableModeEnabled, setTableModeEnabled] = useState(false);
  const [tableLeftName, setTableLeftName] = useState("Links");
  const [tableRightName, setTableRightName] = useState("Rechts");
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
      const effectiveMaxPlayers = tableModeEnabled ? 2 : maxPlayers;
      const { session } = await createGameSession(
        gameCount,
        effectiveMaxPlayers,
        useStrategyRules,
        undefined,
        showOpponentPool,
        poolEndgameEnabled,
      );
      if (tableModeEnabled) {
        const leftPlayerId = createTableModePlayerId();
        const rightPlayerId = createTableModePlayerId();
        const leftJoin = await joinSession(session.inviteCode, leftPlayerId);
        const rightJoin = await joinSession(session.inviteCode, rightPlayerId);
        const leftLabel = tableLeftName.trim() || "Links";
        const rightLabel = tableRightName.trim() || "Rechts";
        const players: [TableModePlayer, TableModePlayer] = [
          {
            side: "left",
            label: leftLabel,
            playerId: leftPlayerId,
            runId: leftJoin.player.runId,
            playerSecret: leftJoin.player.secretToken,
          },
          {
            side: "right",
            label: rightLabel,
            playerId: rightPlayerId,
            runId: rightJoin.player.runId,
            playerSecret: rightJoin.player.secretToken,
          },
        ];
        saveTableModeSession({ inviteCode: session.inviteCode, players });
        saveActiveGame({ type: "table", inviteCode: session.inviteCode });
        setPlayerAlias(leftPlayerId, leftLabel);
        setPlayerAlias(rightPlayerId, rightLabel);
        router.push(
          `/play?table=1&invite=${encodeURIComponent(session.inviteCode)}`,
        );
        return;
      }
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

        <div className="setup-host-card setup-host-card--mode">
          <BonusCelebrationToggle disabled={roomLocked} />
        </div>

        {useStrategyRules && (
          <div className="setup-host-card setup-host-card--mode">
            <div className="setup-mode-toggle">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-strong text-sm font-semibold">Gegner-Pool sichtbar</p>
                  <p className="text-muted mt-0.5 text-xs leading-snug">
                    Zeigt im Spiel den Wurf-Pool des Gegners (nur bei genau 2 Spielern)
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showOpponentPool}
                  aria-label={
                    showOpponentPool ? "Gegner-Pool ausblenden" : "Gegner-Pool anzeigen"
                  }
                  disabled={roomLocked}
                  onClick={() => setShowOpponentPool((v) => !v)}
                  className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition disabled:opacity-50 ${
                    showOpponentPool
                      ? "border-emerald-800 bg-emerald-600"
                      : "border-slate-500 bg-slate-400"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      showOpponentPool ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {useStrategyRules && (
          <div className="setup-host-card setup-host-card--mode">
            <div className="setup-mode-toggle">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-strong text-sm font-semibold">Pool-Endspiel</p>
                  <p className="text-muted mt-0.5 text-xs leading-snug">
                    Wer am Ende die meisten Würfe im Pool hat, darf ein Feld verbessern
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={poolEndgameEnabled}
                  aria-label={
                    poolEndgameEnabled ? "Pool-Endspiel deaktivieren" : "Pool-Endspiel aktivieren"
                  }
                  disabled={roomLocked}
                  onClick={() => setPoolEndgameEnabled((v) => !v)}
                  className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition disabled:opacity-50 ${
                    poolEndgameEnabled
                      ? "border-emerald-800 bg-emerald-600"
                      : "border-slate-500 bg-slate-400"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      poolEndgameEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="setup-host-card setup-host-card--mode">
          <div className="setup-mode-toggle">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-strong text-sm font-semibold">iPad-Tischmodus</p>
                <p className="text-muted mt-0.5 text-xs leading-snug">
                  Erstellt ein 2-Spieler-Spiel für ein iPad im Querformat: links und rechts
                  sind beide Zettel auf diesem Gerät antippbar.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={tableModeEnabled}
                aria-label={
                  tableModeEnabled ? "iPad-Tischmodus deaktivieren" : "iPad-Tischmodus aktivieren"
                }
                disabled={roomLocked}
                onClick={() => {
                  setTableModeEnabled((v) => {
                    const next = !v;
                    if (next) {
                      setMaxPlayers(2);
                    }
                    return next;
                  });
                }}
                className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition disabled:opacity-50 ${
                  tableModeEnabled
                    ? "border-emerald-800 bg-emerald-600"
                    : "border-slate-500 bg-slate-400"
                }`}
              >
                <span
                  className={`absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                    tableModeEnabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {tableModeEnabled && (
          <div className="setup-host-card setup-host-card--mode">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex min-w-0 flex-col gap-1">
                <span className="setup-slider-label text-left">Spieler links</span>
                <input
                  type="text"
                  value={tableLeftName}
                  disabled={roomLocked}
                  maxLength={24}
                  onChange={(e) => setTableLeftName(e.target.value)}
                  className="glass-input min-h-10 px-3 text-sm font-semibold"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1">
                <span className="setup-slider-label text-left">Spieler rechts</span>
                <input
                  type="text"
                  value={tableRightName}
                  disabled={roomLocked}
                  maxLength={24}
                  onChange={(e) => setTableRightName(e.target.value)}
                  className="glass-input min-h-10 px-3 text-sm font-semibold"
                />
              </label>
            </div>
            <p className="text-muted mt-2 text-xs leading-snug">
              Diese Namen werden lokal gespeichert und in Statistik/Paarungen zur Anzeige
              und Zuordnung verwendet.
            </p>
          </div>
        )}

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
            <span className="setup-slider-hint">
              {tableModeEnabled ? "Tischmodus: 2 Spieler" : "2–6 Spieler"}
            </span>
            <input
              type="range"
              min={2}
              max={6}
              value={maxPlayers}
              disabled={roomLocked || tableModeEnabled}
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
            {loading ? "Erstelle …" : tableModeEnabled ? "Tischspiel starten" : "Raum anlegen"}
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
