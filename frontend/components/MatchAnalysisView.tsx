"use client";

import { useState, type ReactNode } from "react";
import { ScoreProgressionChart } from "@/components/ScoreProgressionChart";
import { ShareActionBar } from "@/components/ShareActionBar";
import { fieldLabelForAnalysis } from "@/lib/matchAnalysis";
import {
  buildMatchAnalysisShareText,
  renderMatchAnalysisShareImage,
} from "@/lib/matchResultShare";
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

function Panel({
  kicker,
  title,
  children,
  className = "",
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`match-analysis-panel ${className}`.trim()}>
      <header className="match-analysis-panel-head">
        <p className="match-analysis-panel-kicker">{kicker}</p>
        <h3 className="match-analysis-panel-title">{title}</h3>
      </header>
      <div className="match-analysis-panel-body">{children}</div>
    </section>
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

  const resolvedViewerLabel =
    sessionMeta && ownPlayerId
      ? playerLabel(sessionMeta.viewerName, ownPlayerId, aliases)
      : viewerLabel;
  const resolvedOpponentLabel =
    sessionMeta && sessionMeta.opponentName && ownPlayerId
      ? playerLabel(sessionMeta.opponentName, ownPlayerId, aliases)
      : opponentLabel;

  const buildShareText = () =>
    buildMatchAnalysisShareText({
      analysis,
      viewerLabel: resolvedViewerLabel,
      opponentLabel: resolvedOpponentLabel,
    });

  const buildShareImage = () =>
    renderMatchAnalysisShareImage({
      analysis,
      viewerLabel: resolvedViewerLabel,
      opponentLabel: resolvedOpponentLabel,
    });

  const heroScore = !isMultiRound && h2h
    ? formatSigned(h2h.scoreDiff)
    : String(analysis.viewer.totalScore);

  const heroCaption = !isMultiRound && h2h
    ? `${analysis.viewer.totalScore} vs. ${analysis.opponent?.totalScore ?? "—"}`
    : analysis.viewerRank != null
      ? `Platz ${analysis.viewerRank} von ${analysis.playerCount}${
          analysis.pointsBehindLeader != null && analysis.pointsBehindLeader > 0
            ? ` · ${analysis.pointsBehindLeader} hinter Spitze`
            : " · Spitze"
        }`
      : `${analysis.viewer.gameCount} Spielblock${analysis.viewer.gameCount === 1 ? "" : "e"}`;

  const topFieldDiffs = [...coaching.fieldComparison]
    .filter((c) => c.diff !== 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 6);

  return (
    <div className="match-analysis-screen">
      <section className="match-analysis-hero">
        <span className={`match-analysis-outcome match-analysis-outcome--${badge.tone}`}>
          {badge.label}
        </span>
        <p className="match-analysis-hero-score tabular-nums">{heroScore}</p>
        <p className="match-analysis-hero-caption">{heroCaption}</p>
        {coaching.playStyle && (
          <p className="match-analysis-play-style">{coaching.playStyle}</p>
        )}
        {subtitle && <p className="match-analysis-hero-meta">{subtitle}</p>}
        {sessionMeta && (
          <p className="match-analysis-hero-meta">
            Serie {sessionMeta.leagueCode} · Runde {sessionMeta.roundNumber}
            {analysis.playerCount > 1 && ` · ${analysis.playerCount} Spieler`}
          </p>
        )}
        {isMultiRound && (
          <p className="match-analysis-hero-meta tabular-nums">
            Direktvergleiche {analysis.directWins}–{analysis.directLosses}
            {analysis.directTies > 0 ? `–${analysis.directTies}` : ""}
          </p>
        )}
      </section>

      <ShareActionBar
        label="Analyse teilen"
        shareSuffix="Spielanalyse"
        filename="dicebudget-analyse.png"
        buildText={buildShareText}
        buildImage={buildShareImage}
        prominent
      />

      {analysis.mode === "multi" && analysis.scoreProgression && (
        <Panel kicker="Verlauf" title="Punkte-Duell">
          <ScoreProgressionChart
            progression={analysis.scoreProgression}
            highlightPlayerId={sessionMeta?.viewerPlayerId}
          />
        </Panel>
      )}

      {(hasCoaching || analysis.insights.length > 0) && (
        <Panel kicker="Auswertung" title="Warum so?">
          <p className="match-analysis-narrative">
            {hasCoaching ? coaching.narrative : analysis.insights.join(" ")}
          </p>
        </Panel>
      )}

      {(coaching.strengths.length > 0 || coaching.weaknesses.length > 0) && (
        <Panel kicker="Profil" title="Stärken & Schwächen">
          <div className="match-analysis-trait-grid">
            {coaching.strengths.map((trait) => (
              <article key={`s-${trait.title}`} className="match-analysis-trait match-analysis-trait--strength">
                <p className="match-analysis-trait-title">{trait.title}</p>
                <p className="match-analysis-trait-detail">{trait.detail}</p>
              </article>
            ))}
            {coaching.weaknesses.map((trait) => (
              <article key={`w-${trait.title}`} className="match-analysis-trait match-analysis-trait--weakness">
                <p className="match-analysis-trait-title">{trait.title}</p>
                <p className="match-analysis-trait-detail">{trait.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {coaching.pool && (
        <Panel kicker="Strategy" title="Pool-Report">
          <p className="match-analysis-pool-headline">{coaching.pool.headline}</p>
          <dl className="match-analysis-pool-kpis">
            <div>
              <dt>End-Pool</dt>
              <dd className="tabular-nums">{coaching.pool.endPool}</dd>
            </div>
            <div>
              <dt>Gespart</dt>
              <dd className="tabular-nums">{coaching.pool.poolSpared}</dd>
            </div>
            <div>
              <dt>Eingekauft</dt>
              <dd className="tabular-nums">{coaching.pool.poolSpent}</dd>
            </div>
            <div>
              <dt>Netto</dt>
              <dd className="tabular-nums">{formatSigned(coaching.pool.netBalance)}</dd>
            </div>
          </dl>
          {coaching.pool.notes.length > 0 && (
            <ul className="match-analysis-bullet-list">
              {coaching.pool.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
          {coaching.pool.bestPurchases.length > 0 && (
            <div className="match-analysis-pool-block">
              <p className="match-analysis-pool-label">Starke Pool-Käufe</p>
              <ul className="match-analysis-pool-rows">
                {coaching.pool.bestPurchases.map((row) => (
                  <li key={`${row.gameIndex}-${row.fieldLabel}-best`}>
                    <span>
                      Sp{row.gameIndex} · {row.fieldLabel}
                    </span>
                    <span className="tabular-nums match-analysis-diff--pos">
                      {row.points} Pkt. / {row.poolCost} Würfe
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {coaching.pool.weakPurchases.length > 0 && (
            <div className="match-analysis-pool-block">
              <p className="match-analysis-pool-label">Teure Pool-Käufe</p>
              <ul className="match-analysis-pool-rows">
                {coaching.pool.weakPurchases.map((row) => (
                  <li key={`${row.gameIndex}-${row.fieldLabel}-weak`}>
                    <span>
                      Sp{row.gameIndex} · {row.fieldLabel}
                    </span>
                    <span className="tabular-nums match-analysis-diff--neg">
                      {row.pointsPerRoll.toFixed(1)} Pkt./Wurf
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      )}

      {topFieldDiffs.length > 0 && (
        <Panel kicker="Felder" title="Größte Unterschiede">
          <div className="match-analysis-field-grid">
            {topFieldDiffs.map((cell) => (
              <div
                key={cell.fieldType}
                className={`match-analysis-field-cell ${
                  cell.diff > 0
                    ? "match-analysis-field-cell--pos"
                    : cell.diff < 0
                      ? "match-analysis-field-cell--neg"
                      : ""
                }`}
              >
                <span className="match-analysis-field-label">{cell.label}</span>
                <span className="match-analysis-field-diff tabular-nums">
                  {formatSigned(cell.diff)}
                </span>
                <span className="match-analysis-field-sub tabular-nums">
                  {cell.viewer} · {cell.reference}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {coaching.tips.length > 0 && (
        <Panel kicker="Coach" title="Nächstes Mal">
          <ol className="match-analysis-tips">
            {coaching.tips.map((tip, index) => (
              <li key={tip.title}>
                <span className="match-analysis-tip-index">{index + 1}</span>
                <div>
                  <p className="match-analysis-tip-title">{tip.title}</p>
                  <p className="match-analysis-tip-body">{tip.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <section className="match-analysis-panel match-analysis-panel--details">
        <button
          type="button"
          className="match-analysis-details-toggle"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((v) => !v)}
        >
          <span>Details & Ranking</span>
          <span aria-hidden>{detailsOpen ? "▾" : "▸"}</span>
        </button>
        {detailsOpen && (
          <div className="match-analysis-panel-body match-analysis-details-body">
            {isMultiRound && analysis.ranking.length > 0 && (
              <div className="match-analysis-details-block">
                <p className="match-analysis-details-label">Runden-Ranking</p>
                <ol className="match-analysis-ranking">
                  {analysis.ranking.map((entry) => {
                    const label = playerLabel(entry.playerName, ownPlayerId, aliases);
                    const isViewer = entry.playerId === sessionMeta?.viewerPlayerId;
                    return (
                      <li
                        key={entry.playerId}
                        className={isViewer ? "match-analysis-ranking-row--viewer" : undefined}
                      >
                        <span className="match-analysis-ranking-rank tabular-nums">
                          {entry.rank}.
                        </span>
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
                {h2h.decisiveFieldType && h2h.decisiveFieldDiff !== 0 && (
                  <p className="match-analysis-note">
                    Größte Feld-Differenz: {fieldLabelForAnalysis(h2h.decisiveFieldType)} (
                    {formatSigned(h2h.decisiveFieldDiff)})
                  </p>
                )}
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

      {onBack && (
        <button type="button" onClick={onBack} className="btn-secondary mt-2 w-full">
          {backLabel}
        </button>
      )}
    </div>
  );
}
