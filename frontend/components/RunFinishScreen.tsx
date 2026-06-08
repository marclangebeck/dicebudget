"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShareActionBar } from "@/components/ShareActionBar";
import { StatsRatingToggle } from "@/components/StatsRatingToggle";
import { clearActiveGame } from "@/lib/activeGame";
import { APP_HOME_PATH } from "@/lib/branding";
import {
  buildRunFinishShareText,
  renderRunFinishShareImage,
} from "@/lib/matchResultShare";
import { runHasOpenFields } from "@/lib/runUtils";
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
};

export function RunFinishScreen({
  run,
  onViewSheet,
  onViewAnalysis,
  analysisAvailable = false,
  analysisLoading = false,
  multiplayer,
  onFinalizeStats,
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
    <section id="run-finish-screen" className="play-finish-card px-4 py-5 text-center">
      <p className="text-accent text-sm font-semibold">
        {abandoned ? "Spiel beendet (vorzeitig)" : "Run abgeschlossen"}
      </p>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-emerald-900 md:text-5xl">
        {run.totalScore}
      </p>
      <p className="text-muted mt-1 text-xs">
        Gesamtpunkte · {run.gameCount} {run.gameCount === 1 ? "Spiel" : "Spiele"}
      </p>
      {finishedLabel && <p className="text-subtle mt-1 text-[11px]">{finishedLabel}</p>}

      <ShareActionBar
        label="Ergebnis teilen"
        shareSuffix="Ergebnis"
        filename="dicebudget-ergebnis.png"
        buildText={buildShareText}
        buildImage={buildShareImage}
        prominent
      />

      {multiplayer && onFinalizeStats && (
        <div className="mt-5 text-left">
          <StatsRatingToggle
            includeInStats={includeInStats}
            onChange={setIncludeInStats}
            disabled={leaving}
          />
          {leaveError && (
            <p className="mt-2 text-center text-xs font-medium text-red-700">{leaveError}</p>
          )}
        </div>
      )}

      <ul className="mt-6 space-y-1.5 text-left">
        {run.games.map((game) => (
          <li
            key={game.id}
            className="play-finish-game-row flex items-center justify-between px-3 py-2 text-sm"
          >
            <span className="text-muted">Sp{game.index}</span>
            <span className="text-strong font-semibold tabular-nums">
              {game.summary.gameTotal}
            </span>
          </li>
        ))}
      </ul>

      {run.useStrategyRules && maxRolls !== null && run.rollsRemaining !== null && (
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-emerald-800/20 pt-4 text-xs">
          <div>
            <dt className="text-muted">Würfe genutzt</dt>
            <dd className="text-strong mt-0.5 font-semibold tabular-nums">
              {run.totalRollsUsed}
              <span className="text-muted"> / {maxRolls}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Im Pool</dt>
            <dd className="text-strong mt-0.5 font-semibold tabular-nums">{run.rollsInPool}</dd>
          </div>
          <div>
            <dt className="text-muted">Übrig</dt>
            <dd className="text-strong mt-0.5 font-semibold tabular-nums">{run.rollsRemaining}</dd>
          </div>
        </dl>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {multiplayer && onFinalizeStats ? (
          <button
            type="button"
            disabled={leaving}
            onClick={() => void handleLeaveHome()}
            className="btn-primary inline-flex min-h-10 items-center justify-center px-6 text-sm disabled:opacity-50"
          >
            {leaving ? "Speichere …" : "Spiel beenden und zur Startseite"}
          </button>
        ) : (
          <Link
            href={APP_HOME_PATH}
            className="btn-primary inline-flex min-h-10 items-center justify-center px-6 text-sm"
          >
            Spiel beenden und zur Startseite
          </Link>
        )}
        {onViewSheet && (
          <button
            type="button"
            onClick={onViewSheet}
            className="btn-secondary inline-flex min-h-10 items-center justify-center px-6 text-sm"
          >
            Zettel ansehen
          </button>
        )}
        {analysisAvailable && onViewAnalysis && (
          <button
            type="button"
            disabled={analysisLoading}
            onClick={onViewAnalysis}
            className="btn-secondary inline-flex min-h-10 items-center justify-center px-6 text-sm disabled:opacity-50"
          >
            {analysisLoading ? "Lade Analyse …" : "Spielanalyse"}
          </button>
        )}
      </div>
    </section>
  );
}
