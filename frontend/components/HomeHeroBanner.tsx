"use client";

import { APP_SHORT } from "@/lib/branding";
import { ShareActionBar } from "@/components/ShareActionBar";

type Props = {
  playedLabel: string;
  bestLabel: string;
  avgLabel: string;
  recordTitle: string;
  recordSummaryLabel: string;
  recordWinsLabel: string;
  recordLossesLabel: string;
  winShare: number;
  buildHomeShare: () => string;
  renderHomeShare: () => Promise<Blob>;
  compact?: boolean;
};

export function HomeHeroBanner({
  playedLabel,
  bestLabel,
  avgLabel,
  recordTitle,
  recordSummaryLabel,
  recordWinsLabel,
  recordLossesLabel,
  winShare,
  buildHomeShare,
  renderHomeShare,
  compact = false,
}: Props) {
  return (
    <header className={`home-hero-banner shrink-0 ${compact ? "home-hero-banner--compact" : ""}`}>
      <div className="home-hero-brand-row">
        <img
          src="/apple-touch-icon.png"
          alt=""
          width={88}
          height={88}
          className="home-hero-brand-icon"
          decoding="async"
        />
        <div className="home-hero-copy">
          <p className="home-hero-kicker">{APP_SHORT} · Strategy Edition</p>
          <h1 className="home-hero-title">Wähle deinen Modus</h1>
          {!compact && (
            <p className="home-hero-subtitle">Duell am Tisch oder Solo-Run — volle Strategy-Power.</p>
          )}
        </div>
      </div>
      <div className="home-hero-stats" aria-label="Spielübersicht">
        <span>
          <strong>{playedLabel}</strong>
          Paarungs-Spiele
        </span>
        <span>
          <strong>{bestLabel}</strong>
          Bestwert
        </span>
        <span>
          <strong>{avgLabel}</strong>
          Saison
        </span>
      </div>
      <div className="home-hero-record" aria-label="Persönliche Bilanz">
        <div className="home-hero-record-head">
          <span>{recordTitle}</span>
          <div className="home-hero-record-head-end">
            <strong className="tabular-nums">{recordSummaryLabel}</strong>
            <ShareActionBar
              shareSuffix="Bilanz"
              filename="dicebudget-bilanz.png"
              buildText={buildHomeShare}
              buildImage={renderHomeShare}
              compact
            />
          </div>
        </div>
        <div className="home-hero-record-track" aria-hidden>
          <div className="home-hero-record-track-win" style={{ width: `${winShare}%` }} />
          <div className="home-hero-record-track-loss" style={{ width: `${100 - winShare}%` }} />
        </div>
        <div className="home-hero-record-legend tabular-nums" aria-hidden>
          <span>Siege {recordWinsLabel}</span>
          <span>Niederlagen {recordLossesLabel}</span>
        </div>
      </div>
    </header>
  );
}
