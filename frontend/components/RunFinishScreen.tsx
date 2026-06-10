"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ShareActionBar } from "@/components/ShareActionBar";
import { StatsRatingToggle } from "@/components/StatsRatingToggle";
import { clearActiveGame } from "@/lib/activeGame";
import { APP_HOME_PATH } from "@/lib/branding";
import {
  buildRunFinishShareText,
  renderRunFinishShareImage,
} from "@/lib/matchResultShare";
import { loadPlayerAliases } from "@/lib/playerAliases";
import { playerLabel } from "@/lib/playerIdentity";
import { runHasOpenFields } from "@/lib/runUtils";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import type { RunDto } from "@/lib/types";

type Props = {
  run: RunDto;
  onViewSheet?: () => void;
  onViewAnalysis?: () => void;
  analysisAvailable?: boolean;
  analysisLoading?: boolean;
  /** Multiplayer: Toggle „Werten“ / „Nicht werten“ vor Verlassen. */
  multiplayer?: boolean;
  onFinalizeStats?: (includeInPairingStats: boolean) => Promise<void>;
  /** Optional: Lobby-Stand für Runden-Ranking auf dem Abschluss-Screen. */
  lobby?: SessionLobbyDto | null;
  ownPlayerId?: string;
};

function FinishCard({
  kicker,
  title,
  children,
  className = "",
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`run-finish-section-card ${className}`.trim()}>
      <header className="run-finish-section-head">
        <p className="run-finish-section-kicker">{kicker}</p>
        <h2 className="run-finish-section-title">{title}</h2>
      </header>
      <div className="run-finish-section-body">{children}</div>
    </section>
  );
}

export function RunFinishScreen({
  run,
  onViewSheet,
  onViewAnalysis,
  analysisAvailable = false,
  analysisLoading = false,
  multiplayer,
  onFinalizeStats,
  lobby = null,
  ownPlayerId = "",
}: Props) {
  const router = useRouter();
  const [includeInStats, setIncludeInStats] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    clearActiveGame();
  }, []);

  const abandoned = runHasOpenFields(run);
  const maxRolls = run.useStrategyRules ? run.gameCount * 39 : null;
  const buildShareText = () => buildRunFinishShareText(run);
  const buildShareImage = () => renderRunFinishShareImage(run);
  const finishedLabel = run.finishedAt
    ? new Date(run.finishedAt).toLocaleString("de-DE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const aliases = useMemo(() => loadPlayerAliases(), []);

  const roundRanking = useMemo(() => {
    if (!lobby || lobby.players.length < 2) return [];
    return [...lobby.players]
      .sort((a, b) => b.totalScore - a.totalScore || a.orderIndex - b.orderIndex)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
        isViewer: player.playerId === ownPlayerId,
      }));
  }, [lobby, ownPlayerId]);

  const viewerRank = roundRanking.find((entry) => entry.isViewer)?.rank ?? null;

  async function handleLeaveHome() {
    if (!multiplayer || !onFinalizeStats) {
      router.push(APP_HOME_PATH);
      return;
    }
    setLeaving(true);
    setLeaveError(null);
    try {
      await onFinalizeStats(includeInStats);
      router.push(APP_HOME_PATH);
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div id="run-finish-screen" className="run-finish-dashboard">
      <FinishCard
        kicker="Abschluss"
        title={abandoned ? "Spiel beendet (vorzeitig)" : "Run abgeschlossen"}
        className="run-finish-section-card--hero"
      >
        <div className="run-finish-hero">
          <p className="run-finish-hero-score tabular-nums">{run.totalScore}</p>
          <p className="run-finish-hero-caption">
            Gesamtpunkte · {run.gameCount} {run.gameCount === 1 ? "Spiel" : "Spiele"}
          </p>
          {finishedLabel && <p className="run-finish-hero-meta">{finishedLabel}</p>}
          {multiplayer && viewerRank != null && (
            <p className="run-finish-hero-badge">
              Platz {viewerRank} von {roundRanking.length}
            </p>
          )}
        </div>
        <dl className="run-finish-kpi-grid">
          <div className="run-finish-kpi-card">
            <dt>Spielblöcke</dt>
            <dd className="tabular-nums">{run.gameCount}</dd>
          </div>
          <div className="run-finish-kpi-card">
            <dt>Alle Fünfe +</dt>
            <dd className="tabular-nums">{run.extraYatzyCount}</dd>
          </div>
          {run.useStrategyRules && (
            <div className="run-finish-kpi-card">
              <dt>End-Pool</dt>
              <dd className="tabular-nums">{run.rollsInPool}</dd>
            </div>
          )}
        </dl>
      </FinishCard>

      {roundRanking.length > 0 && (
        <FinishCard kicker="Multiplayer" title="Runden-Ranking">
          <ol className="run-finish-ranking">
            {roundRanking.map((entry) => (
              <li
                key={entry.playerId}
                className={entry.isViewer ? "run-finish-ranking-row--viewer" : undefined}
              >
                <span className="run-finish-ranking-rank tabular-nums">{entry.rank}.</span>
                <span className="run-finish-ranking-name">
                  {playerLabel(entry.playerId, ownPlayerId, aliases)}
                </span>
                <span className="run-finish-ranking-score tabular-nums">{entry.totalScore}</span>
                {!entry.runFinished && (
                  <span className="run-finish-ranking-pending">läuft</span>
                )}
              </li>
            ))}
          </ol>
        </FinishCard>
      )}

      <FinishCard kicker="Teilen" title="Ergebnis-Karte">
        <ShareActionBar
          label="Als Bild teilen"
          shareSuffix="Ergebnis"
          filename="dicebudget-ergebnis.png"
          buildText={buildShareText}
          buildImage={buildShareImage}
          prominent
        />
      </FinishCard>

      {multiplayer && onFinalizeStats && (
        <FinishCard kicker="Statistik" title="Paarungswertung">
          <StatsRatingToggle
            includeInStats={includeInStats}
            onChange={setIncludeInStats}
            disabled={leaving}
          />
          {leaveError && (
            <p className="run-finish-error">{leaveError}</p>
          )}
        </FinishCard>
      )}

      <FinishCard kicker="Aufschlüsselung" title="Punkte je Spielblock">
        <div className="run-finish-game-grid">
          {run.games.map((game) => (
            <article key={game.id} className="run-finish-game-card">
              <p className="run-finish-game-label">Spiel {game.index}</p>
              <p className="run-finish-game-score tabular-nums">{game.summary.gameTotal}</p>
              <dl className="run-finish-game-meta">
                <div>
                  <dt>Oben</dt>
                  <dd className="tabular-nums">{game.summary.ergebnisOben ?? "—"}</dd>
                </div>
                <div>
                  <dt>Unten</dt>
                  <dd className="tabular-nums">{game.summary.lowerSum}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </FinishCard>

      {run.useStrategyRules && maxRolls !== null && run.rollsRemaining !== null && (
        <FinishCard kicker="Strategy" title="Wurf-Pool">
          <dl className="run-finish-kpi-grid run-finish-kpi-grid--pool">
            <div className="run-finish-kpi-card">
              <dt>Genutzt</dt>
              <dd className="tabular-nums">
                {run.totalRollsUsed}
                <span className="run-finish-kpi-sub"> / {maxRolls}</span>
              </dd>
            </div>
            <div className="run-finish-kpi-card">
              <dt>Im Pool</dt>
              <dd className="tabular-nums">{run.rollsInPool}</dd>
            </div>
            <div className="run-finish-kpi-card">
              <dt>Übrig</dt>
              <dd className="tabular-nums">{run.rollsRemaining}</dd>
            </div>
          </dl>
        </FinishCard>
      )}

      <FinishCard kicker="Weiter" title="Nächste Schritte" className="run-finish-section-card--actions">
        <div className="run-finish-actions">
          {multiplayer && onFinalizeStats ? (
            <button
              type="button"
              disabled={leaving}
              onClick={() => void handleLeaveHome()}
              className="btn-primary inline-flex min-h-10 w-full items-center justify-center px-6 text-sm disabled:opacity-50"
            >
              {leaving ? "Speichere …" : "Spiel beenden und zur Startseite"}
            </button>
          ) : (
            <Link
              href={APP_HOME_PATH}
              className="btn-primary inline-flex min-h-10 w-full items-center justify-center px-6 text-sm"
            >
              Spiel beenden und zur Startseite
            </Link>
          )}
          {onViewSheet && (
            <button
              type="button"
              onClick={onViewSheet}
              className="btn-secondary inline-flex min-h-10 w-full items-center justify-center px-6 text-sm"
            >
              Zettel ansehen
            </button>
          )}
          {analysisAvailable && onViewAnalysis && (
            <button
              type="button"
              disabled={analysisLoading}
              onClick={onViewAnalysis}
              className="btn-secondary inline-flex min-h-10 w-full items-center justify-center px-6 text-sm disabled:opacity-50"
            >
              {analysisLoading ? "Lade Analyse …" : "Spielanalyse"}
            </button>
          )}
        </div>
      </FinishCard>
    </div>
  );
}
