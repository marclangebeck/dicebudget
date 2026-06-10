"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { JoinByCodeForm } from "@/components/JoinByCodeForm";
import { createGameSession, joinSession } from "@/lib/api";
import { saveActiveGame } from "@/lib/activeGame";
import { setPlayerAlias } from "@/lib/playerAliases";
import { shareInviteCode } from "@/lib/shareSocial";
import { settingsHrefWithReturn } from "@/lib/settingsReturn";
import { DEFAULT_APP_SETTINGS, getAppSettings, type AppSettings } from "@/lib/uiPrefs";
import {
  createTableModePlayerId,
  saveTableModeSession,
  type TableModePlayer,
} from "@/lib/tableMode";

export default function MultiHostPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [leagueCode, setLeagueCode] = useState<string | null>(null);
  const [createdStrategyMode, setCreatedStrategyMode] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied">("idle");

  useEffect(() => {
    setSettings(getAppSettings());
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const effectiveMaxPlayers = settings.tableModeEnabled ? 2 : settings.multiplayerMaxPlayers;
      const { session } = await createGameSession(
        settings.multiplayerGameCount,
        effectiveMaxPlayers,
        settings.useStrategyRules,
        undefined,
        settings.useStrategyRules && settings.showOpponentPool,
        settings.useStrategyRules && settings.poolEndgameEnabled,
      );
      if (settings.tableModeEnabled) {
        const leftPlayerId = createTableModePlayerId();
        const rightPlayerId = createTableModePlayerId();
        const leftJoin = await joinSession(session.inviteCode, leftPlayerId);
        const rightJoin = await joinSession(session.inviteCode, rightPlayerId);
        const leftLabel = settings.tableLeftName.trim() || "Links";
        const rightLabel = settings.tableRightName.trim() || "Rechts";
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

  async function shareCode() {
    if (!inviteCode) return;
    const result = await shareInviteCode(inviteCode);
    if (result === "shared") {
      setShareState("shared");
      window.setTimeout(() => setShareState("idle"), 2000);
    } else if (result === "copied") {
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    }
  }

  return (
    <div className="setup-host-screen pb-2">
      <AppScreenHeader
        section="Multiplayer"
        title="Multiplayer"
        subtitle="Erstelle einen Raum oder tritt mit einem Code direkt bei."
      />

      <JoinByCodeForm variant="card" />

      <form onSubmit={(e) => void handleCreate(e)} className="setup-host-form">
        <section className="setup-host-success">
          <p className="text-strong text-center text-sm font-semibold">Raum erstellen</p>
          <div className="settings-summary-grid">
            <span>
              <strong>{settings.multiplayerGameCount}</strong>
              Spiele
            </span>
            <span>
              <strong>{settings.tableModeEnabled ? 2 : settings.multiplayerMaxPlayers}</strong>
              Plätze
            </span>
            <span>
              <strong>{settings.useStrategyRules ? "Strategy" : "Klassisch"}</strong>
              Modus
            </span>
            <span>
              <strong>{settings.tableModeEnabled ? "iPad" : "Online"}</strong>
              Tisch
            </span>
          </div>
          {settings.useStrategyRules && (
            <p className="setup-host-success-hint">
              Gegner-Pool {settings.showOpponentPool ? "sichtbar" : "aus"} · Pool-Endspiel{" "}
              {settings.poolEndgameEnabled ? "an" : "aus"}
            </p>
          )}
          {settings.tableModeEnabled && (
            <p className="setup-host-success-hint">
              Tischmodus: {settings.tableLeftName || "Links"} gegen{" "}
              {settings.tableRightName || "Rechts"}
            </p>
          )}
          <Link href={settingsHrefWithReturn("multi")} className="settings-inline-link">
            Einstellungen ändern
          </Link>
        </section>

        {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

        {!inviteCode ? (
          <button
            type="submit"
            disabled={loading}
            className="setup-host-submit w-full disabled:opacity-50"
          >
            {loading
              ? "Erstelle …"
              : settings.tableModeEnabled
                ? "Tischspiel starten"
                : "Raum anlegen"}
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
              onClick={() => void shareCode()}
              className="home-bento-submit home-bento-submit--lg w-full font-semibold"
            >
              {shareState === "shared"
                ? "Geteilt!"
                : shareState === "copied"
                  ? "Kopiert!"
                  : "Code teilen"}
            </button>

            <p className="setup-host-success-hint">
              Gäste: Multiplayer → Code eingeben.
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
