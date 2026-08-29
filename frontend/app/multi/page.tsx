"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { HostInviteQrPanel } from "@/components/HostInviteQrPanel";
import { HostSetupQuickPick } from "@/components/HostSetupQuickPick";
import { createGameSession, joinSession } from "@/lib/api";
import { saveActiveGame } from "@/lib/activeGame";
import { sessionHouseRuleFlagsFromPrefs } from "@/lib/featureFlags";
import { upsertRivalName } from "@/lib/rivalProfiles";
import { settingsHrefWithReturn } from "@/lib/settingsReturn";
import {
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  updateAppSettings,
  type AppSettings,
} from "@/lib/uiPrefs";
import {
  createTableModePlayerId,
  saveTableModeSession,
  type TableModePlayer,
} from "@/lib/tableMode";

type QuickPickKind = "games" | "seats" | "mode" | null;

export default function MultiHostPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickPick, setQuickPick] = useState<QuickPickKind>(null);

  useEffect(() => {
    setSettings(getAppSettings());
  }, []);

  function patchSettings(update: Partial<AppSettings>) {
    setSettings(updateAppSettings(update));
  }

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

  const seatsLocked = settings.tableModeEnabled;
  const picksLocked = !!inviteCode;
  const seatValue = String(seatsLocked ? 2 : settings.multiplayerMaxPlayers);

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
            <button
              type="button"
              className="settings-summary-chip"
              disabled={picksLocked}
              aria-label={`Spiele: ${settings.multiplayerGameCount}. Tippen zum Ändern.`}
              onClick={() => setQuickPick("games")}
            >
              <strong>{settings.multiplayerGameCount}</strong>
              Spiele
            </button>
            <button
              type="button"
              className="settings-summary-chip"
              disabled={picksLocked || seatsLocked}
              aria-label={
                seatsLocked
                  ? "Plätze: 2 (Tischmodus)"
                  : `Plätze: ${settings.multiplayerMaxPlayers}. Tippen zum Ändern.`
              }
              onClick={() => {
                if (!seatsLocked) setQuickPick("seats");
              }}
            >
              <strong>{seatsLocked ? 2 : settings.multiplayerMaxPlayers}</strong>
              Plätze
            </button>
            <button
              type="button"
              className="settings-summary-chip"
              disabled={picksLocked}
              aria-label={`Modus: ${settings.useStrategyRules ? "Strategy" : "Klassisch"}. Tippen zum Ändern.`}
              onClick={() => setQuickPick("mode")}
            >
              <strong>{settings.useStrategyRules ? "Strategy" : "Klassisch"}</strong>
              Modus
            </button>
            <span>
              <strong>{settings.tableModeEnabled ? "iPad" : "Online"}</strong>
              Tisch
            </span>
          </div>
          {!picksLocked && (
            <p className="setup-host-success-hint">
              Spiele, Plätze und Modus antippen zum Ändern
              {seatsLocked ? " (Plätze im Tischmodus fest 2)" : ""}.
            </p>
          )}
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
            Weitere Einstellungen
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
          <HostInviteQrPanel inviteCode={inviteCode} />
        )}
      </form>

      <HostSetupQuickPick
        open={quickPick === "games"}
        title="Anzahl Spiele"
        value={String(settings.multiplayerGameCount)}
        options={[1, 2, 3, 4, 5, 6].map((n) => ({
          value: String(n),
          label: String(n),
        }))}
        onChange={(value) => patchSettings({ multiplayerGameCount: Number(value) })}
        onClose={() => setQuickPick(null)}
      />
      <HostSetupQuickPick
        open={quickPick === "seats"}
        title="Plätze im Raum"
        value={seatValue}
        options={[2, 3, 4, 5, 6].map((n) => ({
          value: String(n),
          label: String(n),
        }))}
        onChange={(value) => patchSettings({ multiplayerMaxPlayers: Number(value) })}
        onClose={() => setQuickPick(null)}
      />
      <HostSetupQuickPick
        open={quickPick === "mode"}
        title="Spielmodus"
        value={settings.useStrategyRules ? "strategy" : "classic"}
        options={[
          { value: "classic", label: "Klassisch" },
          { value: "strategy", label: "Strategy" },
        ]}
        onChange={(value) => patchSettings({ useStrategyRules: value === "strategy" })}
        onClose={() => setQuickPick(null)}
      />
    </div>
  );
}
