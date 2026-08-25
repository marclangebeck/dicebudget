"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HostInviteQrPanel } from "@/components/HostInviteQrPanel";
import { createGameSession, joinSession } from "@/lib/api";
import { saveActiveGame } from "@/lib/activeGame";
import { sessionHouseRuleFlagsFromPrefs } from "@/lib/featureFlags";
import { createLocalSoloRun } from "@/lib/localSoloRun";
import { upsertRivalName } from "@/lib/rivalProfiles";
import {
  createTableModePlayerId,
  saveTableModeSession,
  type TableModePlayer,
} from "@/lib/tableMode";
import type { AppSettings } from "@/lib/uiPrefs";

type Props = {
  settings: AppSettings;
};

export function SettingsGameActions({ settings }: Props) {
  const router = useRouter();
  const [soloLoading, setSoloLoading] = useState(false);
  const [multiLoading, setMultiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  async function handleSoloStart() {
    setSoloLoading(true);
    setError(null);
    try {
      const run = createLocalSoloRun(settings.soloGameCount, settings.useStrategyRules);
      saveActiveGame({ type: "solo", runId: run.id });
      router.push(`/play?runId=${run.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Solo-Start fehlgeschlagen");
    } finally {
      setSoloLoading(false);
    }
  }

  async function handleMultiStart() {
    setMultiLoading(true);
    setError(null);
    setInviteCode(null);
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
        router.push(`/play?table=1&invite=${encodeURIComponent(session.inviteCode)}`);
        return;
      }
      setInviteCode(session.inviteCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Multi-Start fehlgeschlagen");
    } finally {
      setMultiLoading(false);
    }
  }

  const busy = soloLoading || multiLoading;

  return (
    <section className="settings-group settings-group--actions">
      <h2 className="settings-group-title">Spiel starten</h2>

      {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

      {!inviteCode ? (
        <div className="settings-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSoloStart()}
            className="setup-host-submit setup-host-submit--sky disabled:opacity-50"
          >
            {soloLoading ? "Starte …" : "Solo"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleMultiStart()}
            className="setup-host-submit disabled:opacity-50"
          >
            {multiLoading
              ? "Erstelle …"
              : settings.tableModeEnabled
                ? "Tisch"
                : "Multi"}
          </button>
        </div>
      ) : (
        <HostInviteQrPanel
          inviteCode={inviteCode}
          lobbyLinkClassName="setup-host-submit mt-2 flex w-full items-center justify-center no-underline"
        />
      )}
    </section>
  );
}
