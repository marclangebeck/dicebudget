"use client";

import { fieldLabelForAnalysis } from "@/lib/matchAnalysis";
import type {
  MatchAnalysisDto,
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
        </p>
      )}

      {h2h && (
        <div className="match-analysis-headline mt-4">
          <p className="match-analysis-score tabular-nums">
            {formatSigned(h2h.scoreDiff)}
          </p>
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

      {!h2h && (
        <div className="match-analysis-headline mt-4">
          <p className="match-analysis-score tabular-nums">{analysis.viewer.totalScore}</p>
          <p className="text-muted text-xs">Einzelspiel · {analysis.viewer.gameCount} Spielblock</p>
        </div>
      )}

      {analysis.insights.length > 0 && (
        <ul className="match-analysis-insights mt-4">
          {analysis.insights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      {h2h && (
        <section className="match-analysis-section mt-5">
          <h3 className="match-analysis-section-title">Warum ±? (Head-to-Head)</h3>
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
              {formatSigned(h2h.decisiveGameDiff)} vs. {resolvedOpponentLabel})
            </p>
          )}
          {h2h.decisiveFieldType && h2h.decisiveFieldDiff !== 0 && (
            <p className="match-analysis-note text-xs">
              Größte Feld-Differenz: {fieldLabelForAnalysis(h2h.decisiveFieldType)} (
              {formatSigned(h2h.decisiveFieldDiff)})
            </p>
          )}
        </section>
      )}

      {analysis.mode === "multi" && analysis.opponent && (
        <div className="match-analysis-compare mt-5 space-y-4">
          <MetricsGrid title={resolvedViewerLabel} metrics={analysis.viewer} />
          <MetricsGrid title={resolvedOpponentLabel} metrics={analysis.opponent} />
        </div>
      )}

      {analysis.mode === "solo" && (
        <div className="mt-5">
          <MetricsGrid title="Dein Spiel" metrics={analysis.viewer} />
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
