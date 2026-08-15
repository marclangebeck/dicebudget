"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { createGameSession, joinSession } from "@/lib/api";
import { saveActiveGame } from "@/lib/activeGame";
import { sessionHouseRuleFlagsFromPrefs } from "@/lib/featureFlags";
import { upsertRivalName } from "@/lib/rivalProfiles";
import { buildInviteJoinUrl } from "@/lib/inviteJoinUrl";
import { InviteQrCode } from "@/components/InviteQrCode";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        sessionHouseRuleFlagsFromPrefs(),
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
        upsertRivalName(leftPlayerId, leftLabel);
        upsertRivalName(rightPlayerId, rightLabel);
        router.push(
          `/play?table=1&invite=${encodeURIComponent(session.inviteCode)}`,
        );
        return;
      }
      setInviteCode(session.inviteCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erstellung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="setup-host-screen pb-2">
      <AppScreenHeader
        section="Multiplayer"
        title="Multiplayer"
        subtitle="Raum erstellen und QR zeigen — Gäste scannen und treten bei."
      />

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
              Tischmodus: {settings.tableLeftName.trim() || "…"} gegen{" "}
              {settings.tableRightName.trim() || "…"}
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
          <div className="setup-host-success setup-host-success--invite-qr">
            <p className="setup-host-invite-title">Spiel beitreten</p>
            <div className="setup-host-qr-frame">
              <InviteQrCode
                value={buildInviteJoinUrl(inviteCode)}
                label="QR-Code zum Beitreten"
                size={228}
              />
            </div>
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
