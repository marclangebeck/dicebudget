"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { getPairingSummaries, getStats } from "@/lib/api";
import { APP_SHORT } from "@/lib/branding";
import {
  buildHomeRecordShareText,
  renderHomeRecordShareImage,
  type HomeRecordShareParams,
} from "@/lib/matchResultShare";
import { mergePairingSummaries } from "@/lib/pairingMerge";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { getOrCreatePlayerId, normalizePublicPlayerId, playerLabel } from "@/lib/playerIdentity";
import { loadPlayerAliases, type PlayerAliasMap } from "@/lib/playerAliases";
import type { StatsDto } from "@/lib/statsTypes";
import { ShareActionBar } from "@/components/ShareActionBar";

type NavTileProps = {
  href: string;
  area: string;
  tone: "multi" | "stats" | "solo" | "settings";
  title: string;
  subtitle: string;
  badge: string;
  cta: string;
  iconSrc: string;
  footer?: ReactNode;
};

function NavTile({
  href,
  area,
  tone,
  title,
  subtitle,
  badge,
  cta,
  iconSrc,
  footer,
}: NavTileProps) {
  return (
    <Link
      href={href}
      className={`home-bento-tile home-bento-tile--${tone} flex min-h-0 flex-col no-underline`}
      style={{ gridArea: area }}
    >
      <span className="home-bento-badge">{badge}</span>
      <span className="home-bento-tile-arrow" aria-hidden>
        →
      </span>
      <div className="home-bento-poster-art">
        <img src={iconSrc} alt="" className="home-bento-motif" loading="eager" decoding="async" />
      </div>
      <div className="home-bento-tile-footer shrink-0">
        <p className="home-bento-title">{title}</p>
        <p className="home-bento-subtitle">{subtitle}</p>
        {footer}
        <p className="home-bento-cta">{cta}</p>
      </div>
    </Link>
  );
}

export function HomeBentoGrid() {
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [pairings, setPairings] = useState<PairingSummaryDto[] | null>(null);
  const [pairingsError, setPairingsError] = useState<string | null>(null);
  const [ownPlayerId, setOwnPlayerId] = useState("");
  const [aliases, setAliases] = useState<PlayerAliasMap>({});

  useEffect(() => {
    setOwnPlayerId(getOrCreatePlayerId());
    setAliases(loadPlayerAliases());
  }, []);

  useEffect(() => {
    void getStats()
      .then(({ stats: data }) => setStats(data))
      .catch((e) =>
        setStatsError(e instanceof Error ? e.message : "Statistik nicht geladen"),
      );
  }, []);

  useEffect(() => {
    void getPairingSummaries()
      .then(({ pairings: data }) => setPairings(data))
      .catch((e) =>
        setPairingsError(e instanceof Error ? e.message : "Paarungen nicht geladen"),
      );
  }, []);

  const statsFooter =
    statsError !== null ? (
      <p className="text-[10px] font-medium text-red-800 mt-1">—</p>
    ) : stats === null ? (
      <p className="home-bento-mini-stat">Lade...</p>
    ) : stats.finishedRuns === 0 ? (
      <p className="home-bento-mini-stat">Noch kein Rekord</p>
    ) : (
      <p className="home-bento-stat-value mt-1 tabular-nums">{stats.bestTotalScore}</p>
    );

  const mergedPairings =
    pairings === null ? null : mergePairingSummaries(pairings, aliases, ownPlayerId);
  const totalPairingRounds =
    mergedPairings === null
      ? null
      : mergedPairings.reduce((sum, pairing) => sum + pairing.roundsPlayed, 0);

  const playedLabel =
    pairingsError !== null ? "—" : totalPairingRounds === null ? "..." : String(totalPairingRounds);
  const bestLabel = stats?.bestTotalScore == null ? "Offen" : String(stats.bestTotalScore);
  const avgLabel =
    stats?.averageTotalScore == null ? "Bereit" : `${Math.round(stats.averageTotalScore)} Ø`;
  const ownPlayerNorm = ownPlayerId ? normalizePublicPlayerId(ownPlayerId) : "";
  const ownPlayerInPairings =
    mergedPairings?.some(
      (pairing) =>
        normalizePublicPlayerId(pairing.playerA) === ownPlayerNorm ||
        normalizePublicPlayerId(pairing.playerB) === ownPlayerNorm,
    ) ?? false;
  const fallbackPerspective =
    mergedPairings
      ?.flatMap((pairing) => [pairing.playerA, pairing.playerB])
      .find((playerId) => aliases[normalizePublicPlayerId(playerId)]?.trim()) ?? "";
  const recordPerspectiveId = ownPlayerInPairings ? ownPlayerId : fallbackPerspective;
  const recordPerspectiveNorm = recordPerspectiveId
    ? normalizePublicPlayerId(recordPerspectiveId)
    : "";
  const recordTitle =
    recordPerspectiveId && !ownPlayerInPairings
      ? `${playerLabel(recordPerspectiveId, ownPlayerId, aliases)} Bilanz`
      : "Deine Bilanz";
  const ownRecord =
    mergedPairings === null || recordPerspectiveNorm === ""
      ? null
      : mergedPairings.reduce(
          (record, pairing) => {
            if (normalizePublicPlayerId(pairing.playerA) === recordPerspectiveNorm) {
              record.wins += pairing.playerAWins;
              record.losses += pairing.playerBWins;
              record.ties += pairing.ties;
            } else if (normalizePublicPlayerId(pairing.playerB) === recordPerspectiveNorm) {
              record.wins += pairing.playerBWins;
              record.losses += pairing.playerAWins;
              record.ties += pairing.ties;
            }
            return record;
          },
          { wins: 0, losses: 0, ties: 0 },
        );
  const decidedRecordGames =
    ownRecord === null ? 0 : ownRecord.wins + ownRecord.losses;
  const winShare =
    ownRecord === null || decidedRecordGames === 0
      ? 50
      : Math.round((ownRecord.wins / decidedRecordGames) * 100);
  const hasOwnRecord = ownRecord !== null && ownRecord.wins + ownRecord.losses + ownRecord.ties > 0;
  const recordSummaryLabel =
    hasOwnRecord && ownRecord !== null ? `${ownRecord.wins}:${ownRecord.losses}` : "Offen";
  const recordWinsLabel = hasOwnRecord && ownRecord !== null ? String(ownRecord.wins) : "—";
  const recordLossesLabel = hasOwnRecord && ownRecord !== null ? String(ownRecord.losses) : "—";

  const homeShareParams: HomeRecordShareParams = {
    recordTitle,
    wins: ownRecord?.wins ?? 0,
    losses: ownRecord?.losses ?? 0,
    ties: ownRecord?.ties ?? 0,
    bestScore: stats?.bestTotalScore ?? null,
    pairingGames: totalPairingRounds,
  };
  const buildHomeShare = () => buildHomeRecordShareText(homeShareParams);
  const renderHomeShare = () => renderHomeRecordShareImage(homeShareParams);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">
      <header className="home-hero-banner shrink-0">
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
            <h1 className="home-hero-title">Bereit für die nächste Runde?</h1>
            <p className="home-hero-subtitle">Risiko, Timing und Rivalität in jedem Wurf.</p>
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
          <div className="home-hero-record-metrics">
            <span className="home-hero-record-win">
              <strong>{recordWinsLabel}</strong>
              Gewonnen
            </span>
            <span className="home-hero-record-loss">
              <strong>{recordLossesLabel}</strong>
              Verloren
            </span>
          </div>
          <div className="home-hero-record-track" aria-hidden>
            <div className="home-hero-record-track-win" style={{ width: `${winShare}%` }} />
            <div className="home-hero-record-track-loss" style={{ width: `${100 - winShare}%` }} />
          </div>
        </div>
      </header>

      <div className="home-bento-grid min-h-0">
        <NavTile
          href="/multi"
          area="multi"
          tone="multi"
          title="Multiplayer"
          subtitle="Erstelle einen Raum oder tritt per Code bei."
          badge="Multiplayer"
          cta="Zum Mehrspieler"
          iconSrc="/home-icons/multiplayer.png"
        />
        <NavTile
          href="/stats"
          area="stats"
          tone="stats"
          title="Statistik"
          subtitle="Rekorde, Duelle und Erfolge auf einen Blick."
          badge="Rangliste"
          cta="Erfolge ansehen"
          iconSrc="/home-icons/stats.png"
          footer={statsFooter}
        />
        <NavTile
          href="/solo"
          area="solo"
          tone="solo"
          title="Einzelspiel"
          subtitle="Trainiere deinen Run mit taktischem Fokus."
          badge="Solo"
          cta="Run starten"
          iconSrc="/home-icons/solo.png"
        />
        <NavTile
          href="/settings"
          area="settings"
          tone="settings"
          title="Einstellungen"
          subtitle="Standards für Solo, Multiplayer und Tischmodus."
          badge="App"
          cta="Defaults setzen"
          iconSrc="/home-icons/settings.png"
        />
      </div>

    </div>
  );
}
