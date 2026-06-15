"use client";

import { useState, type ReactNode } from "react";
import { ScoreProgressionChart } from "@/components/ScoreProgressionChart";
import { fieldLabelForAnalysis } from "@/lib/matchAnalysis";
import {
  EMPTY_MATCH_COACHING,
  type HeadToHeadAnalysisDto,
  type MatchAnalysisDto,
  type MatchCoachingDto,
  type PlayerComparisonDto,
  type PlayerRunMetricsDto,
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

function resolveCoaching(analysis: MatchAnalysisDto): MatchCoachingDto {
  return analysis.coaching ?? EMPTY_MATCH_COACHING;
}

function outcomeBadge(
  analysis: MatchAnalysisDto,
  h2h: HeadToHeadAnalysisDto | null,
  isMultiRound: boolean,
): { label: string; tone: "win" | "loss" | "tie" | "lead" | "mid" } {
  if (analysis.mode === "solo") {
    return { label: "Einzelspiel", tone: "lead" };
  }
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

function focusTitle(
  analysis: MatchAnalysisDto,
  h2h: HeadToHeadAnalysisDto | null,
  isMultiRound: boolean,
): string {
  if (analysis.mode === "solo") return "Dein Lauf";
  if (!isMultiRound && h2h) {
    if (h2h.winner === "opponent") return "Warum verloren?";
    if (h2h.winner === "viewer") return "Warum gewonnen?";
    return "Was war entscheidend?";
  }
  if (analysis.viewerRank === 1) return "Warum gewonnen?";
  return "Warum zurückgelegen?";
}

function ComparisonCard({
  comparison,
  ownPlayerId,
  aliases,
  defaultOpen,
}: {
  comparison: PlayerComparisonDto;
  ownPlayerId: string;
  aliases: PlayerAliasMap;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const name = playerLabel(comparison.opponentName, ownPlayerId, aliases);
  const { headToHead: h2h } = comparison;
  const resultLabel =
    h2h.winner === "viewer" ? "Sieg" : h2h.winner === "opponent" ? "Niederlage" : "Remis";

  return (
    <article className="match-analysis-compare-card">
      <button
        type="button"
        className="match-analysis-compare-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="match-analysis-compare-name">{name}</span>
        <span className="match-analysis-compare-meta tabular-nums">
          {resultLabel} · {formatSigned(h2h.scoreDiff)}
        </span>
      </button>
      {open && (
        <div className="match-analysis-compare-body">
          <ul className="match-analysis-attribution">
            {h2h.attribution.map((row) => (
              <li key={row.key}>
                <span className="match-analysis-attribution-label">{row.label}</span>
                <span className="match-analysis-attribution-values tabular-nums">
                  {row.viewerValue} · {row.opponentValue}
                </span>
                <span
                  className={`match-analysis-attribution-diff tabular-nums ${
                    row.diff > 0
                      ? "match-analysis-diff--pos"
                      : row.diff < 0
                        ? "match-analysis-diff--neg"
                        : ""
                  }`}
                >
                  {formatSigned(row.diff)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function MetricsCompact({ metrics }: { metrics: PlayerRunMetricsDto }) {
  return (
    <dl className="match-analysis-kpi-grid">
      <div>
        <dt>Punkte</dt>
        <dd className="tabular-nums">{metrics.totalScore}</dd>
      </div>
      <div>
        <dt>Bonus</dt>
        <dd className="tabular-nums">{metrics.bonusCount}</dd>
      </div>
      <div>
        <dt>Oben</dt>
        <dd className="tabular-nums">{metrics.upperSumTotal}</dd>
      </div>
      <div>
        <dt>Unten</dt>
        <dd className="tabular-nums">{metrics.lowerSumTotal}</dd>
      </div>
      {metrics.useStrategyRules && (
        <>
          <div>
            <dt>End-Pool</dt>
            <dd className="tabular-nums">{metrics.rollsInPool}</dd>
          </div>
          <div>
            <dt>Pool ±</dt>
            <dd className="tabular-nums">
              {metrics.poolSpared}/{metrics.poolSpent}
            </dd>
          </div>
        </>
      )}
      <div>
        <dt>Alle Fünfe</dt>
        <dd className="tabular-nums">
          {metrics.yatzyHits}/{metrics.yatzyMisses}
        </dd>
      </div>
      <div>
        <dt>Nullen</dt>
        <dd className="tabular-nums">{metrics.zeroEntries}</dd>
      </div>
    </dl>
  );
}

function FocusList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="match-analysis-focus-block">
      <p className="match-analysis-focus-label">{title}</p>
      <ul className="match-analysis-focus-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
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
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const coaching = resolveCoaching(analysis);
  const h2h = analysis.headToHead;
  const sessionMeta = "inviteCode" in analysis ? analysis : null;
  const isMultiRound = analysis.playerCount > 2;
  const badge = outcomeBadge(analysis, h2h, isMultiRound);
  const hasCoaching = Boolean(analysis.coaching?.narrative);
  const isLoss =
    analysis.mode !== "solo" &&
    ((!isMultiRound && h2h?.winner === "opponent") ||
      (isMultiRound && analysis.viewerRank != null && analysis.viewerRank > 1));

  const resolvedViewerLabel =
    sessionMeta && ownPlayerId
      ? playerLabel(sessionMeta.viewerName, ownPlayerId, aliases)
      : viewerLabel;
  const resolvedOpponentLabel =
    sessionMeta && sessionMeta.opponentName && ownPlayerId
      ? playerLabel(sessionMeta.opponentName, ownPlayerId, aliases)
      : opponentLabel;

  const heroScore = !isMultiRound && h2h
    ? formatSigned(h2h.scoreDiff)
    : String(analysis.viewer.totalScore);

  const heroCaption = !isMultiRound && h2h
    ? `${analysis.viewer.totalScore} vs. ${analysis.opponent?.totalScore ?? "—"}`
    : analysis.viewerRank != null
      ? `Platz ${analysis.viewerRank} von ${analysis.playerCount}`
      : `${analysis.viewer.gameCount} Spielblock${analysis.viewer.gameCount === 1 ? "" : "e"}`;

  const topFieldDiffs = [...coaching.fieldComparison]
    .filter((c) => c.diff !== 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);

  const focusWeaknesses = coaching.weaknesses.slice(0, isLoss ? 2 : 1).map((t) => `${t.title}: ${t.detail}`);
  const focusStrengths = coaching.strengths.slice(0, isLoss ? 0 : 1).map((t) => `${t.title}: ${t.detail}`);
  const focusTips = coaching.tips.slice(0, 2).map((t) => `${t.title} — ${t.body}`);
  const fieldLines = topFieldDiffs.map(
    (cell) => `${cell.label}: ${formatSigned(cell.diff)} (${cell.viewer} vs. ${cell.reference})`,
  );

  const hasDetails =
    coaching.pool != null ||
    coaching.strengths.length > focusStrengths.length ||
    coaching.weaknesses.length > focusWeaknesses.length ||
    coaching.tips.length > focusTips.length ||
    topFieldDiffs.length < coaching.fieldComparison.filter((c) => c.diff !== 0).length ||
    (isMultiRound && analysis.ranking.length > 0) ||
    (isMultiRound && analysis.comparisons.length > 0) ||
    (!isMultiRound && h2h != null);

  return (
    <div className="match-analysis-screen">
      <section className="match-analysis-hero match-analysis-hero--compact">
        <span className={`match-analysis-outcome match-analysis-outcome--${badge.tone}`}>
          {badge.label}
        </span>
        <p className="match-analysis-hero-score tabular-nums">{heroScore}</p>
        <p className="match-analysis-hero-caption">{heroCaption}</p>
        {coaching.playStyle && <p className="match-analysis-play-style">{coaching.playStyle}</p>}
        {subtitle && <p className="match-analysis-hero-meta">{subtitle}</p>}
        {sessionMeta && (
          <p className="match-analysis-hero-meta">
            Serie {sessionMeta.leagueCode} · Runde {sessionMeta.roundNumber}
          </p>
        )}
      </section>

      <section className="match-analysis-card match-analysis-card--highlight match-analysis-focus-card">
        <header className="match-analysis-card-head">
          <p className="match-analysis-card-kicker">Kern</p>
          <h3 className="match-analysis-card-title">{focusTitle(analysis, h2h, isMultiRound)}</h3>
        </header>
        <div className="match-analysis-card-body">
          <p className="match-analysis-narrative match-analysis-narrative--compact">
            {hasCoaching ? coaching.narrative : analysis.insights.slice(0, 2).join(" ")}
          </p>
          <FocusList title={isLoss ? "Hauptgründe" : "Stärke"} items={isLoss ? focusWeaknesses : focusStrengths} />
          <FocusList title="Nächster Schritt" items={focusTips} />
          <FocusList title="Größte Felder" items={fieldLines} />
        </div>
      </section>

      {analysis.mode === "multi" && analysis.scoreProgression && (
        <section className="match-analysis-card">
          <header className="match-analysis-card-head">
            <p className="match-analysis-card-kicker">Verlauf</p>
            <h3 className="match-analysis-card-title">Führung alle 10 %</h3>
          </header>
          <div className="match-analysis-card-body">
            <ScoreProgressionChart
              progression={analysis.scoreProgression}
              highlightPlayerId={sessionMeta?.viewerPlayerId}
            />
          </div>
        </section>
      )}

      {hasDetails && (
        <section className="match-analysis-card match-analysis-card--details">
          <button
            type="button"
            className="match-analysis-details-toggle"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((v) => !v)}
          >
            <span>
              <span className="match-analysis-details-toggle-kicker">Mehr</span>
              <span className="match-analysis-details-toggle-title">
                Pool, Ranking & Kennzahlen
              </span>
            </span>
            <span aria-hidden>{detailsOpen ? "▾" : "▸"}</span>
          </button>
          {detailsOpen && (
            <div className="match-analysis-card-body match-analysis-details-body">
              {coaching.pool && (
                <div className="match-analysis-details-block">
                  <p className="match-analysis-details-label">Pool</p>
                  <p className="match-analysis-pool-headline">{coaching.pool.headline}</p>
                  {coaching.pool.notes.length > 0 && (
                    <ul className="match-analysis-bullet-list">
                      {coaching.pool.notes.slice(0, 3).map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {isMultiRound && analysis.ranking.length > 0 && (
                <div className="match-analysis-details-block">
                  <p className="match-analysis-details-label">Ranking</p>
                  <ol className="match-analysis-ranking">
                    {analysis.ranking.map((entry) => {
                      const label = playerLabel(entry.playerName, ownPlayerId, aliases);
                      const isViewer = entry.playerId === sessionMeta?.viewerPlayerId;
                      return (
                        <li
                          key={entry.playerId}
                          className={isViewer ? "match-analysis-ranking-row--viewer" : undefined}
                        >
                          <span className="match-analysis-ranking-rank tabular-nums">{entry.rank}.</span>
                          <span className="match-analysis-ranking-name">{label}</span>
                          <span className="match-analysis-ranking-score tabular-nums">
                            {entry.totalScore}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {isMultiRound && analysis.comparisons.length > 0 && (
                <div className="match-analysis-details-block">
                  <p className="match-analysis-details-label">Direktvergleiche</p>
                  <div className="match-analysis-compare-list">
                    {analysis.comparisons.map((comparison, index) => (
                      <ComparisonCard
                        key={comparison.opponentPlayerId}
                        comparison={comparison}
                        ownPlayerId={ownPlayerId}
                        aliases={aliases}
                        defaultOpen={index === 0}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!isMultiRound && h2h && (
                <div className="match-analysis-details-block">
                  <p className="match-analysis-details-label">
                    Aufschlüsselung vs. {resolvedOpponentLabel}
                  </p>
                  <ul className="match-analysis-attribution">
                    {h2h.attribution.map((row) => (
                      <li key={row.key}>
                        <span className="match-analysis-attribution-label">{row.label}</span>
                        <span className="match-analysis-attribution-values tabular-nums">
                          {row.viewerValue} · {row.opponentValue}
                        </span>
                        <span
                          className={`match-analysis-attribution-diff tabular-nums ${
                            row.diff > 0
                              ? "match-analysis-diff--pos"
                              : row.diff < 0
                                ? "match-analysis-diff--neg"
                                : ""
                          }`}
                        >
                          {formatSigned(row.diff)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="match-analysis-details-block">
                <p className="match-analysis-details-label">{resolvedViewerLabel}</p>
                <MetricsCompact metrics={analysis.viewer} />
              </div>

              {!isMultiRound && analysis.mode === "multi" && analysis.opponent && (
                <div className="match-analysis-details-block">
                  <p className="match-analysis-details-label">{resolvedOpponentLabel}</p>
                  <MetricsCompact metrics={analysis.opponent} />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {onBack && (
        <button type="button" onClick={onBack} className="btn-secondary mt-1 w-full">
          {backLabel}
        </button>
      )}
    </div>
  );
}
