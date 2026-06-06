"use client";

import { useState } from "react";
import { fieldLabelForAnalysis } from "@/lib/matchAnalysis";
import type {
  HeadToHeadAnalysisDto,
  MatchAnalysisDto,
  PlayerComparisonDto,
  PlayerRunMetricsDto,
  SessionMatchAnalysisDto,
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

function MetricsGrid({
  title,
  metrics,
}: {
  title: string;
  metrics: PlayerRunMetricsDto;
}) {
  return (
    <section className="match-analysis-section">
      <h3 className="match-analysis-section-title">{title}</h3>
      <dl className="match-analysis-metrics">
        <div>
          <dt>Gesamtpunkte</dt>
          <dd className="tabular-nums">{metrics.totalScore}</dd>
        </div>
        <div>
          <dt>Bonus (Anzahl)</dt>
          <dd className="tabular-nums">{metrics.bonusCount}</dd>
        </div>
        <div>
          <dt>Obere Sektion</dt>
          <dd className="tabular-nums">{metrics.upperSumTotal}</dd>
        </div>
        <div>
          <dt>Untere Sektion</dt>
          <dd className="tabular-nums">{metrics.lowerSumTotal}</dd>
        </div>
        {metrics.useStrategyRules && (
          <>
            <div>
              <dt>End-Pool</dt>
              <dd className="tabular-nums">{metrics.rollsInPool}</dd>
            </div>
            <div>
              <dt>Pool gespart / eingekauft</dt>
              <dd className="tabular-nums">
                {metrics.poolSpared} / {metrics.poolSpent}
              </dd>
            </div>
            {metrics.pointsPerPoolRoll != null && metrics.poolRollCost > 0 && (
              <div>
                <dt>Pkt pro Pool-Wurf</dt>
                <dd className="tabular-nums">{metrics.pointsPerPoolRoll.toFixed(1)}</dd>
              </div>
            )}
          </>
        )}
        <div>
          <dt>Yatzy Treffer / Null</dt>
          <dd className="tabular-nums">
            {metrics.yatzyHits} / {metrics.yatzyMisses}
          </dd>
        </div>
        <div>
          <dt>Null-Einträge</dt>
          <dd className="tabular-nums">{metrics.zeroEntries}</dd>
        </div>
      </dl>
    </section>
  );
}

function HeadToHeadBlock({
  h2h,
  opponentLabel,
  compact = false,
}: {
  h2h: HeadToHeadAnalysisDto;
  opponentLabel: string;
  compact?: boolean;
}) {
  return (
    <section className={compact ? "match-analysis-section mt-3" : "match-analysis-section mt-5"}>
      {!compact && (
        <h3 className="match-analysis-section-title">Warum ±? (Head-to-Head)</h3>
      )}
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
      {h2h.decisiveGameIndex != null && h2h.decisiveGameDiff !== 0 && (
        <p className="match-analysis-note mt-3 text-xs">
          Entscheidendster Block: Sp{h2h.decisiveGameIndex} (
          {formatSigned(h2h.decisiveGameDiff)} vs. {opponentLabel})
        </p>
      )}
      {h2h.decisiveFieldType && h2h.decisiveFieldDiff !== 0 && (
        <p className="match-analysis-note text-xs">
          Größte Feld-Differenz: {fieldLabelForAnalysis(h2h.decisiveFieldType)} (
          {formatSigned(h2h.decisiveFieldDiff)})
        </p>
      )}
    </section>
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
    h2h.winner === "viewer"
      ? "Du gewinnst"
      : h2h.winner === "opponent"
        ? "Du verlierst"
        : "Remis";

  return (
    <article className="match-analysis-comparison">
      <button
        type="button"
        className="match-analysis-comparison-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-strong text-sm font-semibold">{name}</span>
        <span className="text-muted text-xs tabular-nums">
          {resultLabel} · {formatSigned(h2h.scoreDiff)}
        </span>
      </button>
      {open && (
        <div className="match-analysis-comparison-body">
          <HeadToHeadBlock h2h={h2h} opponentLabel={name} compact />
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
  if (!analysis.ready) {
    return (
      <section className="match-analysis-card">
        <p className="match-analysis-lead">Spielanalyse</p>
        <p className="text-muted mt-2 text-sm">
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

  const resolvedViewerLabel =
    sessionMeta && ownPlayerId
      ? playerLabel(sessionMeta.viewerName, ownPlayerId, aliases)
      : viewerLabel;
  const resolvedOpponentLabel =
    sessionMeta && sessionMeta.opponentName && ownPlayerId
      ? playerLabel(sessionMeta.opponentName, ownPlayerId, aliases)
      : opponentLabel;

  return (
    <section className="match-analysis-card">
      <p className="match-analysis-lead">Spielanalyse</p>
      {subtitle && <p className="text-muted mt-1 text-xs">{subtitle}</p>}
      {sessionMeta && (
        <p className="text-muted mt-1 text-xs">
          Serie {sessionMeta.leagueCode} · Runde {sessionMeta.roundNumber}
          {analysis.playerCount > 1 && ` · ${analysis.playerCount} Spieler`}
        </p>
      )}

      {isMultiRound && analysis.viewerRank != null && (
        <div className="match-analysis-headline mt-4">
          <p className="match-analysis-score tabular-nums">{analysis.viewer.totalScore}</p>
          <p className="text-muted text-xs">
            Platz {analysis.viewerRank} von {analysis.playerCount}
            {analysis.pointsBehindLeader != null && analysis.pointsBehindLeader > 0
              ? ` · ${analysis.pointsBehindLeader} hinter Spitze`
              : " · Spitze"}
          </p>
          <p className="text-muted mt-1 text-xs tabular-nums">
            Direktvergleiche: {analysis.directWins}–{analysis.directLosses}
            {analysis.directTies > 0 ? `–${analysis.directTies}` : ""}
          </p>
        </div>
      )}

      {!isMultiRound && h2h && (
        <div className="match-analysis-headline mt-4">
          <p className="match-analysis-score tabular-nums">{formatSigned(h2h.scoreDiff)}</p>
          <p className="text-muted text-xs">
            {h2h.winner === "viewer"
              ? "Du liegst vorne"
              : h2h.winner === "opponent"
                ? "Gegner liegt vorne"
                : "Remis"}
            {" · "}
            {analysis.viewer.totalScore} vs. {analysis.opponent?.totalScore ?? "—"}
          </p>
        </div>
      )}

      {analysis.mode === "solo" && (
        <div className="match-analysis-headline mt-4">
          <p className="match-analysis-score tabular-nums">{analysis.viewer.totalScore}</p>
          <p className="text-muted text-xs">
            Einzelspiel · {analysis.viewer.gameCount}{" "}
            {analysis.viewer.gameCount === 1 ? "Spielblock" : "Spielblöcke"}
          </p>
        </div>
      )}

      {analysis.insights.length > 0 && (
        <ul className="match-analysis-insights mt-4">
          {analysis.insights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      {isMultiRound && analysis.ranking.length > 0 && (
        <section className="match-analysis-section mt-5">
          <h3 className="match-analysis-section-title">Runden-Ranking</h3>
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
        </section>
      )}

      {!isMultiRound && h2h && (
        <HeadToHeadBlock h2h={h2h} opponentLabel={resolvedOpponentLabel} />
      )}

      <div className="mt-5">
        <MetricsGrid
          title={isMultiRound ? `Dein Spiel (${resolvedViewerLabel})` : resolvedViewerLabel}
          metrics={analysis.viewer}
        />
      </div>

      {isMultiRound && analysis.comparisons.length > 0 && (
        <section className="match-analysis-section mt-5">
          <h3 className="match-analysis-section-title">Direktvergleiche</h3>
          <div className="match-analysis-comparison-list">
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
        </section>
      )}

      {!isMultiRound && analysis.mode === "multi" && analysis.opponent && (
        <div className="mt-4">
          <MetricsGrid title={resolvedOpponentLabel} metrics={analysis.opponent} />
        </div>
      )}

      {onBack && (
        <button type="button" onClick={onBack} className="btn-secondary mt-5 w-full">
          {backLabel}
        </button>
      )}
    </section>
  );
}
