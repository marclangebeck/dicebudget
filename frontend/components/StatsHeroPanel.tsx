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
    <section className="stats-hero-panel" aria-label="Statistik-Übersicht">
      <div className="stats-hero-panel-top">
        <div className="stats-hero-panel-copy">
          <p className="stats-hero-panel-kicker">Übersicht</p>
          <p className="stats-hero-panel-title">{recordTitle}</p>
        </div>
        <div className="stats-hero-panel-score-wrap">
          <strong className="stats-hero-panel-score tabular-nums">{recordSummaryLabel}</strong>
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
        <div className="stats-hero-panel-track-wrap">
          <div className="home-hero-record-track stats-hero-panel-track" aria-hidden>
            <div className="home-hero-record-track-win" style={{ width: `${winShare}%` }} />
            <div className="home-hero-record-track-loss" style={{ width: `${100 - winShare}%` }} />
          </div>
          <p className="stats-hero-panel-winshare tabular-nums">{winShare}% Siegquote</p>
        </div>
      )}

      <div className="stats-hero-panel-kpis" aria-label="Kennzahlen">
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

      {hasRecord && (
        <p className="stats-hero-panel-legend tabular-nums" aria-hidden>
          Siege {recordWinsLabel} · Niederlagen {recordLossesLabel}
        </p>
      )}
    </section>
  );
}
