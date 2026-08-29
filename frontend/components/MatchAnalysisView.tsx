"use client";

import { useEffect, useState } from "react";
import { ScoreProgressionChart } from "@/components/ScoreProgressionChart";
import {
  type MatchAnalysisDto,
  type SessionMatchAnalysisDto,
} from "@/lib/matchAnalysisTypes";
import { playerLabel } from "@/lib/playerIdentity";
import type { PlayerAliasMap } from "@/lib/playerAliases";

type Props = {
  analysis: MatchAnalysisDto | SessionMatchAnalysisDto;
  ownPlayerId?: string;
  aliases?: PlayerAliasMap;
  viewerLabel?: string;
  opponentLabel?: string;
  subtitle?: string | null;
  onBack?: () => void;
  backLabel?: string;
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
  onBack,
  backLabel = "Zurück",
}: Props) {
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 520px)");
    const apply = () => setLandscape(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (!analysis.ready) {
    return (
      <section className="match-analysis-screen">
        <p className="match-analysis-empty">
          {analysis.unavailableReason ?? "Analyse noch nicht verfügbar."}
        </p>
        {onBack && (
          <button type="button" onClick={onBack} className="btn-secondary mt-4 w-full">
            {backLabel}
          </button>
        )}
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

  const hasChart = analysis.mode === "multi" && !!analysis.scoreProgression;
  const showLandscapeHint = hasChart && !landscape;

  return (
    <div
      className={`match-analysis-screen match-analysis-screen--chart-focus${
        landscape ? " match-analysis-screen--landscape" : ""
      }`}
    >
      <section
        className={`match-analysis-hero match-analysis-hero--result${
          landscape ? " match-analysis-hero--landscape-slim" : ""
        }`}
      >
        <div className="match-analysis-result-row">
          <span className={`match-analysis-outcome match-analysis-outcome--${badge.tone}`}>
            {badge.label}
          </span>
          <p className="match-analysis-hero-score tabular-nums">{heroScore}</p>
          <p className="match-analysis-hero-caption">{heroCaption}</p>
        </div>
        {!landscape && rankingLine && (
          <p className="match-analysis-ranking-inline">{rankingLine}</p>
        )}
        {!landscape && subtitle && <p className="match-analysis-hero-meta">{subtitle}</p>}
        {!landscape && sessionMeta && (
          <p className="match-analysis-hero-meta">
            Serie {sessionMeta.leagueCode} · Runde {sessionMeta.roundNumber}
          </p>
        )}
        {showLandscapeHint && (
          <p className="match-analysis-rotate-hint">Quer drehen für großen Verlauf</p>
        )}
      </section>

      {hasChart ? (
        <section className="match-analysis-chart-stage">
          {!landscape && (
            <header className="match-analysis-chart-head">
              <p className="match-analysis-card-kicker">Verlauf</p>
              <h3 className="match-analysis-card-title">Führung & Vorsprung</h3>
            </header>
          )}
          <ScoreProgressionChart
            progression={analysis.scoreProgression!}
            highlightPlayerId={sessionMeta?.viewerPlayerId}
            expansive={landscape}
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

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className={`btn-secondary match-analysis-back-btn${
            landscape ? " match-analysis-back-btn--slim" : ""
          }`}
        >
          {backLabel}
        </button>
      )}
    </div>
  );
}
