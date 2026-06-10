"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

type ArenaPaneProps = {
  href: string;
  tone: "multi" | "solo";
  label: string;
  cta: string;
  iconSrc: string;
};

function ArenaPane({ href, tone, label, cta, iconSrc }: ArenaPaneProps) {
  return (
    <Link
      href={href}
      className={`home-arena-pane home-bento-tile home-bento-tile--arena home-bento-tile--${tone} home-arena-pane--${tone} flex min-h-0 flex-col no-underline`}
    >
      <div className="home-bento-scene" aria-hidden />
      <span className="home-arena-pane-label">{label}</span>
      <div className={`home-arena-pane-icon home-arena-pane-icon--${tone}`}>
        <span className="home-bento-icon-glow" aria-hidden />
        <span className="home-bento-icon-ring" aria-hidden />
        <img src={iconSrc} alt="" className="home-bento-motif" loading="eager" decoding="async" />
      </div>
      <span className="home-arena-pane-cta home-bento-play-btn">{cta}</span>
    </Link>
  );
}

export function HomeBentoGrid() {
  const [stats, setStats] = useState<StatsDto | null>(null);
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
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    void getPairingSummaries()
      .then(({ pairings: data }) => setPairings(data))
      .catch((e) =>
        setPairingsError(e instanceof Error ? e.message : "Paarungen nicht geladen"),
      );
  }, []);

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
            <h1 className="home-hero-title">Wähle deinen Modus</h1>
            <p className="home-hero-subtitle">Duell am Tisch oder Solo-Run — volle Strategy-Power.</p>
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

      <div className="home-play-arena min-h-0 flex-1">
        <ArenaPane
          href="/multi"
          tone="multi"
          label="Multi"
          cta="Lobby öffnen"
          iconSrc="/home-icons/multiplayer.png"
        />
        <ArenaPane
          href="/solo"
          tone="solo"
          label="Solo"
          cta="Run starten"
          iconSrc="/home-icons/solo.png"
        />
        <div className="home-play-arena-brand" aria-hidden>
          <div className="home-play-arena-brand-scene" />
          <img
            src="/logo-source.png"
            alt=""
            width={96}
            height={96}
            className="home-play-arena-brand-logo"
            decoding="async"
          />
          <span className="home-play-arena-brand-name">{APP_SHORT}</span>
        </div>
      </div>

    </div>
  );
}
