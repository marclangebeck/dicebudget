"use client";

import { useMemo } from "react";
import { ScoreProgressionChart } from "@/components/ScoreProgressionChart";
import {
  type MatchAnalysisDto,
  type SessionMatchAnalysisDto,
} from "@/lib/matchAnalysisTypes";
import { playerLabel } from "@/lib/playerIdentity";
import type { PlayerAliasMap } from "@/lib/playerAliases";
import { normalizeScoreProgression } from "@/lib/scoreProgressionChart";

type Props = {
  analysis: MatchAnalysisDto | SessionMatchAnalysisDto;
  ownPlayerId?: string;
  aliases?: PlayerAliasMap;
  viewerLabel?: string;
  opponentLabel?: string;
  subtitle?: string | null;
  /** Primäraktion unten (z. B. Spiel beenden → Startseite). */
  onFinish?: () => void;
  finishLabel?: string;
  finishing?: boolean;
};

function formatSigned(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function outcomeBadge(
  analysis: MatchAnalysisDto,
  isMultiRound: boolean,
): { label: string; tone: "win" | "loss" | "tie" | "lead" | "mid" } {
  if (analysis.mode === "solo") {
    return { label: "Einzelspiel", tone: "lead" };
  }
  const h2h = analysis.headToHead;
  if (!isMultiRound && h2h) {
    if (h2h.winner === "viewer") return { label: "Sieg", tone: "win" };
    if (h2h.winner === "opponent") return { label: "Niederlage", tone: "loss" };
    return { label: "Remis", tone: "tie" };
  }
  if (analysis.viewerRank === 1) return { label: "Rundensieg", tone: "win" };
  if (analysis.viewerRank != null && analysis.viewerRank <= 2) {
    return { label: `Platz ${analysis.viewerRank}`, tone: "mid" };
  }
  return {
    label: analysis.viewerRank != null ? `Platz ${analysis.viewerRank}` : "Ergebnis",
    tone: "loss",
  };
}

export function MatchAnalysisView({
  analysis,
  ownPlayerId = "",
  aliases = {},
  viewerLabel = "Du",
  opponentLabel = "Gegner",
  subtitle,
  onFinish,
  finishLabel = "Spiel beenden und zur Startseite",
  finishing = false,
}: Props) {
  const scoreProgression = useMemo(
    () => normalizeScoreProgression(analysis.scoreProgression),
    [analysis.scoreProgression],
  );

  const finishButton = onFinish ? (
    <button
      type="button"
      disabled={finishing}
      onClick={onFinish}
      className="btn-primary match-analysis-back-btn disabled:opacity-50"
    >
      {finishing ? "Speichere …" : finishLabel}
    </button>
  ) : null;

  if (!analysis.ready) {
    return (
      <section className="match-analysis-screen">
        <p className="match-analysis-empty">
          {analysis.unavailableReason ?? "Analyse noch nicht verfügbar."}
        </p>
        {finishButton}
      </section>
    );
  }

  const h2h = analysis.headToHead;
  const sessionMeta = "inviteCode" in analysis ? analysis : null;
  const isMultiRound = analysis.playerCount > 2;
  const badge = outcomeBadge(analysis, isMultiRound);

  const resolvedViewerLabel =
    sessionMeta && ownPlayerId
      ? playerLabel(sessionMeta.viewerName, ownPlayerId, aliases)
      : viewerLabel;
  const resolvedOpponentLabel =
    sessionMeta && sessionMeta.opponentName && ownPlayerId
      ? playerLabel(sessionMeta.opponentName, ownPlayerId, aliases)
      : opponentLabel;

  const heroScore =
    !isMultiRound && h2h
      ? formatSigned(h2h.scoreDiff)
      : String(analysis.viewer.totalScore);

  const heroCaption =
    !isMultiRound && h2h
      ? `${analysis.viewer.totalScore} vs. ${analysis.opponent?.totalScore ?? "—"}`
      : analysis.viewerRank != null
        ? `Platz ${analysis.viewerRank} von ${analysis.playerCount}`
        : `${analysis.viewer.gameCount} Spielblock${analysis.viewer.gameCount === 1 ? "" : "e"}`;

  const rankingLine =
    analysis.mode === "multi" && analysis.ranking.length > 0
      ? analysis.ranking
          .map((entry) => {
            const name = playerLabel(entry.playerName, ownPlayerId, aliases);
            return `${entry.rank}. ${name} ${entry.totalScore}`;
          })
          .join(" · ")
      : null;

  const hasChart = analysis.mode === "multi" && scoreProgression != null;

  return (
    <div className="match-analysis-screen match-analysis-screen--chart-focus">
      <section className="match-analysis-hero match-analysis-hero--result">
        <div className="match-analysis-result-row">
          <span className={`match-analysis-outcome match-analysis-outcome--${badge.tone}`}>
            {badge.label}
          </span>
          <p className="match-analysis-hero-score tabular-nums">{heroScore}</p>
          <p className="match-analysis-hero-caption">{heroCaption}</p>
        </div>
        {rankingLine && <p className="match-analysis-ranking-inline">{rankingLine}</p>}
        {subtitle && <p className="match-analysis-hero-meta">{subtitle}</p>}
        {sessionMeta && (
          <p className="match-analysis-hero-meta">
            Serie {sessionMeta.leagueCode} · Runde {sessionMeta.roundNumber}
          </p>
        )}
      </section>

      {hasChart ? (
        <section className="match-analysis-chart-stage">
          <header className="match-analysis-chart-head">
            <p className="match-analysis-card-kicker">Verlauf</p>
            <h3 className="match-analysis-card-title">Führung & Vorsprung</h3>
          </header>
          <ScoreProgressionChart
            progression={scoreProgression}
            highlightPlayerId={sessionMeta?.viewerPlayerId}
          />
        </section>
      ) : (
        <section className="match-analysis-card">
          <div className="match-analysis-card-body">
            <p className="match-analysis-empty">
              {analysis.mode === "solo"
                ? "Verlaufs-Chart gibt es im Mehrspieler."
                : "Kein Verlauf verfügbar."}
            </p>
            {analysis.mode === "multi" && (
              <p className="match-analysis-hero-meta">
                {resolvedViewerLabel}
                {analysis.opponent ? ` vs. ${resolvedOpponentLabel}` : ""}
              </p>
            )}
          </div>
        </section>
      )}

      {finishButton}
    </div>
  );
}
