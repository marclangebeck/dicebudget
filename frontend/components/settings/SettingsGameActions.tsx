"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createGameSession, joinSession } from "@/lib/api";
import { saveActiveGame } from "@/lib/activeGame";
import { sessionHouseRuleFlagsFromPrefs } from "@/lib/featureFlags";
import { createLocalSoloRun } from "@/lib/localSoloRun";
import { upsertRivalName } from "@/lib/rivalProfiles";
import { shareInviteCode } from "@/lib/shareSocial";
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
  const [leagueCode, setLeagueCode] = useState<string | null>(null);
  const [createdStrategyMode, setCreatedStrategyMode] = useState<boolean | null>(null);
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied">("idle");

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
    setLeagueCode(null);
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
      setLeagueCode(session.leagueCode);
      setCreatedStrategyMode(session.useStrategyRules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Multi-Start fehlgeschlagen");
    } finally {
      setMultiLoading(false);
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
        <div className="settings-compact-card settings-compact-card--wide settings-compact-card--slim">
          <p className="settings-compact-title settings-compact-title--sm">Raum angelegt</p>
          <p className="settings-compact-text settings-compact-text--sm">
            Modus:{" "}
            <strong className="text-strong">
              {createdStrategyMode ? "Strategy Edition" : "DiceBudget Klassisch"}
            </strong>
          </p>
          <div className="mt-2">
            <p className="setup-host-code-label">Raum-Code</p>
            <p className="setup-host-code">{inviteCode}</p>
          </div>
          {leagueCode && (
            <div className="mt-2">
              <p className="setup-host-code-label">Serie</p>
              <p className="setup-host-code setup-host-code--league">{leagueCode}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => void shareCode()}
            className="home-bento-submit home-bento-submit--lg mt-3 w-full font-semibold"
          >
            {shareState === "shared"
              ? "Geteilt!"
              : shareState === "copied"
                ? "Kopiert!"
                : "Code teilen"}
          </button>
          <Link
            href={`/multi/join?code=${encodeURIComponent(inviteCode)}`}
            className="setup-host-submit mt-2 flex w-full items-center justify-center no-underline"
          >
            Zur Lobby
          </Link>
        </div>
      )}
    </section>
  );
}
