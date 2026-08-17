"use client";

import { ShareActionBar } from "@/components/ShareActionBar";
import {
  buildHomeRecordShareText,
  renderHomeRecordShareImage,
} from "@/lib/matchResultShare";
import type { StatsOverview } from "@/lib/statsOverview";

type Props = {
  overview: StatsOverview;
};

export function StatsHeroPanel({ overview }: Props) {
  const {
    recordTitle,
    recordSummaryLabel,
    recordWinsLabel,
    recordLossesLabel,
    winShare,
    hasRecord,
    pairingCount,
    totalRounds,
    bestLabel,
    avgLabel,
    homeShareParams,
  } = overview;

  return (
    <>
      <div className="settings-toggle-row">
        <div className="settings-toggle-row-copy">
          <p className="settings-toggle-row-title">{recordTitle}</p>
          <p className="settings-toggle-row-hint">
            {hasRecord
              ? `Siegquote ${winShare}% · S ${recordWinsLabel} · N ${recordLossesLabel}`
              : "Noch keine entschiedenen Spiele"}
          </p>
        </div>
        <div className="stats-overview-score">
          <span className="stats-overview-score-value tabular-nums">{recordSummaryLabel}</span>
          <ShareActionBar
            shareSuffix="Bilanz"
            filename="dicebudget-bilanz.png"
            buildText={() => buildHomeRecordShareText(homeShareParams)}
            buildImage={() => renderHomeRecordShareImage(homeShareParams)}
            compact
          />
        </div>
      </div>
      {hasRecord && (
        <div className="stats-overview-track" aria-hidden>
          <span className="stats-overview-track-win" style={{ width: `${winShare}%` }} />
        </div>
      )}
      <div className="stats-overview-kpis" aria-label="Kennzahlen">
        <span>
          <strong className="tabular-nums">{pairingCount}</strong>
          {pairingCount === 1 ? "Paarung" : "Paarungen"}
        </span>
        <span>
          <strong className="tabular-nums">{totalRounds}</strong>
          Runden
        </span>
        <span>
          <strong className="tabular-nums">{bestLabel}</strong>
          Best
        </span>
        <span>
          <strong className="tabular-nums">{avgLabel}</strong>
          Saison
        </span>
      </div>
    </>
  );
}
