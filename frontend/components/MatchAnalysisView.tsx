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

function AnalysisCard({
  kicker,
  title,
  children,
  className = "",
  tone = "default",
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "highlight" | "strength" | "weakness" | "tip";
}) {
  return (
    <section
      className={`match-analysis-card match-analysis-card--${tone} ${className}`.trim()}
    >
      <header className="match-analysis-card-head">
        <p className="match-analysis-card-kicker">{kicker}</p>
        <h3 className="match-analysis-card-title">{title}</h3>
      </header>
      <div className="match-analysis-card-body">{children}</div>
    </section>
  );
}

function SectionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="match-analysis-section-group">
      <h2 className="match-analysis-section-heading">{title}</h2>
      <div className="match-analysis-section-cards">{children}</div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="match-analysis-stat-card">
      <p className="match-analysis-stat-label">{label}</p>
      <p className="match-analysis-stat-value tabular-nums">{value}</p>
      {hint && <p className="match-analysis-stat-hint">{hint}</p>}
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

  const quickStats: { label: string; value: string; hint?: string }[] = [];

  if (!isMultiRound && h2h) {
    quickStats.push(
      { label: "Deine Punkte", value: String(analysis.viewer.totalScore) },
      { label: "Gegner", value: String(analysis.opponent?.totalScore ?? "—") },
      { label: "Differenz", value: formatSigned(h2h.scoreDiff) },
      {
        label: "Alle Fünfe",
        value: `${analysis.viewer.yatzyHits}/${analysis.viewer.yatzyMisses}`,
      },
    );
  } else if (isMultiRound) {
    quickStats.push(
      {
        label: "Platz",
        value: analysis.viewerRank != null ? String(analysis.viewerRank) : "—",
      },
      { label: "Punkte", value: String(analysis.viewer.totalScore) },
      {
        label: "Direktbilanz",
        value: `${analysis.directWins}–${analysis.directLosses}${
          analysis.directTies > 0 ? `–${analysis.directTies}` : ""
        }`,
      },
      {
        label: "Zur Spitze",
        value:
          analysis.pointsBehindLeader != null && analysis.pointsBehindLeader > 0
            ? `${analysis.pointsBehindLeader} Pkt.`
            : "Spitze",
      },
    );
  } else {
    quickStats.push(
      { label: "Punkte", value: String(analysis.viewer.totalScore) },
      { label: "Bonus", value: String(analysis.viewer.bonusCount) },
      {
        label: "Alle Fünfe",
        value: `${analysis.viewer.yatzyHits}/${analysis.viewer.yatzyMisses}`,
      },
      { label: "Nullen", value: String(analysis.viewer.zeroEntries) },
    );
  }

  return (
    <div className="match-analysis-screen">
      <SectionGroup title="Ergebnis">
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
        </section>

        <div className="match-analysis-quick-stats">
          {quickStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </SectionGroup>

      {analysis.mode === "multi" && analysis.scoreProgression && (
        <SectionGroup title="Verlauf">
          <AnalysisCard kicker="Duell" title="Punkte über die Runde">
            <ScoreProgressionChart
              progression={analysis.scoreProgression}
              highlightPlayerId={sessionMeta?.viewerPlayerId}
            />
          </AnalysisCard>
        </SectionGroup>
      )}

      {(hasCoaching ||
        coaching.strengths.length > 0 ||
        coaching.weaknesses.length > 0 ||
        analysis.insights.length > 0) && (
        <SectionGroup title="Auswertung">
          {(hasCoaching || analysis.insights.length > 0) && (
            <AnalysisCard kicker="Zusammenfassung" title="Warum so?" tone="highlight">
              <p className="match-analysis-narrative">
                {hasCoaching ? coaching.narrative : analysis.insights.join(" ")}
              </p>
            </AnalysisCard>
          )}

          {coaching.strengths.length > 0 && (
            <AnalysisCard kicker="Profil" title="Stärken" tone="strength">
              <div className="match-analysis-trait-stack">
                {coaching.strengths.map((trait) => (
                  <article
                    key={`s-${trait.title}`}
                    className="match-analysis-trait match-analysis-trait--strength"
                  >
                    <p className="match-analysis-trait-title">{trait.title}</p>
                    <p className="match-analysis-trait-detail">{trait.detail}</p>
                  </article>
                ))}
              </div>
            </AnalysisCard>
          )}

          {coaching.weaknesses.length > 0 && (
            <AnalysisCard kicker="Profil" title="Schwächen" tone="weakness">
              <div className="match-analysis-trait-stack">
                {coaching.weaknesses.map((trait) => (
                  <article
                    key={`w-${trait.title}`}
                    className="match-analysis-trait match-analysis-trait--weakness"
                  >
                    <p className="match-analysis-trait-title">{trait.title}</p>
                    <p className="match-analysis-trait-detail">{trait.detail}</p>
                  </article>
                ))}
              </div>
            </AnalysisCard>
          )}
        </SectionGroup>
      )}

      {coaching.pool && (
        <SectionGroup title="Strategy">
          <AnalysisCard kicker="Pool" title="Pool-Report">
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
          </AnalysisCard>

          {coaching.pool.bestPurchases.length > 0 && (
            <AnalysisCard kicker="Käufe" title="Starke Pool-Käufe" tone="strength">
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
            </AnalysisCard>
          )}

          {coaching.pool.weakPurchases.length > 0 && (
            <AnalysisCard kicker="Käufe" title="Teure Pool-Käufe" tone="weakness">
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
            </AnalysisCard>
          )}
        </SectionGroup>
      )}

      {topFieldDiffs.length > 0 && (
        <SectionGroup title="Felder">
          <AnalysisCard kicker="Vergleich" title="Größte Unterschiede">
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
          </AnalysisCard>
        </SectionGroup>
      )}

      {coaching.tips.length > 0 && (
        <SectionGroup title="Coaching">
          <div className="match-analysis-tip-grid">
            {coaching.tips.map((tip, index) => (
              <article key={tip.title} className="match-analysis-tip-card">
                <span className="match-analysis-tip-index">{index + 1}</span>
                <div>
                  <p className="match-analysis-tip-title">{tip.title}</p>
                  <p className="match-analysis-tip-body">{tip.body}</p>
                </div>
              </article>
            ))}
          </div>
        </SectionGroup>
      )}

      {isMultiRound && analysis.ranking.length > 0 && (
        <SectionGroup title="Runde">
          <AnalysisCard kicker="Ranking" title="Runden-Ranking">
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
          </AnalysisCard>

          {analysis.comparisons.length > 0 && (
            <AnalysisCard kicker="Duell" title="Direktvergleiche">
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
            </AnalysisCard>
          )}
        </SectionGroup>
      )}

      <SectionGroup title="Details">
        <section className="match-analysis-card match-analysis-card--details">
          <button
            type="button"
            className="match-analysis-details-toggle"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((v) => !v)}
          >
            <span>
              <span className="match-analysis-details-toggle-kicker">Metriken</span>
              <span className="match-analysis-details-toggle-title">
                Aufschlüsselung & Kennzahlen
              </span>
            </span>
            <span aria-hidden>{detailsOpen ? "▾" : "▸"}</span>
          </button>
          {detailsOpen && (
            <div className="match-analysis-card-body match-analysis-details-body">
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
      </SectionGroup>

      {onBack && (
        <button type="button" onClick={onBack} className="btn-secondary mt-1 w-full">
          {backLabel}
        </button>
      )}
    </div>
  );
}
