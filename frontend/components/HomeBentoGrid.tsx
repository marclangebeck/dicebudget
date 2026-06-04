"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { getPairingSummaries, getStats } from "@/lib/api";
import { APP_SHORT } from "@/lib/branding";
import { mergePairingSummaries } from "@/lib/pairingMerge";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { getOrCreatePlayerId, normalizePublicPlayerId, playerLabel } from "@/lib/playerIdentity";
import { loadPlayerAliases, type PlayerAliasMap } from "@/lib/playerAliases";
import type { StatsDto } from "@/lib/statsTypes";

function SoloMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <ellipse cx="82" cy="99" rx="54" ry="10" fill="rgba(15,23,42,0.28)" />
      <rect x="39" y="19" width="68" height="82" rx="16" fill="rgba(255,255,255,0.92)" />
      <rect x="49" y="32" width="40" height="6" rx="3" fill="#2F6F73" opacity="0.82" />
      <rect x="49" y="48" width="44" height="6" rx="3" fill="#7CB7AE" opacity="0.78" />
      <rect x="49" y="64" width="32" height="6" rx="3" fill="#D6A85A" opacity="0.82" />
      <rect x="92" y="45" width="50" height="50" rx="14" fill="url(#soloDie)" />
      <rect x="92" y="45" width="50" height="50" rx="14" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      <circle cx="107" cy="60" r="3.8" fill="white" />
      <circle cx="126" cy="60" r="3.8" fill="white" />
      <circle cx="116.5" cy="70" r="3.8" fill="white" />
      <circle cx="107" cy="80" r="3.8" fill="white" />
      <circle cx="126" cy="80" r="3.8" fill="white" />
      <path d="M24 89c23-16 47-16 70 0" stroke="rgba(255,255,255,0.54)" strokeWidth="5" strokeLinecap="round" />
      <defs>
        <linearGradient id="soloDie" x1="92" y1="54" x2="134" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7CB7AE" />
          <stop offset="1" stopColor="#2F6F73" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MultiMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <path d="M24 72c23-34 89-34 112 0" stroke="rgba(255,255,255,0.34)" strokeWidth="6" strokeLinecap="round" />
      <rect x="18" y="49" width="48" height="42" rx="12" fill="rgba(124,183,174,0.18)" stroke="rgba(124,183,174,0.62)" strokeWidth="2" />
      <rect x="94" y="49" width="48" height="42" rx="12" fill="rgba(214,168,90,0.16)" stroke="rgba(214,168,90,0.62)" strokeWidth="2" />
      <path d="M29 65h25M29 77h18M106 65h25M113 77h18" stroke="rgba(255,255,255,0.72)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="42" cy="34" r="14" fill="#7CB7AE" />
      <circle cx="118" cy="34" r="14" fill="#D6A85A" />
      <path d="M23 58c4-14 14-21 29-21s25 7 29 21" fill="rgba(124,183,174,0.72)" />
      <path d="M79 58c4-14 14-21 29-21s25 7 29 21" fill="rgba(214,168,90,0.68)" />
      <rect x="61" y="32" width="42" height="42" rx="12" fill="url(#multiDie)" />
      <rect x="61" y="32" width="42" height="42" rx="12" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
      <circle cx="73" cy="44" r="3.4" fill="white" />
      <circle cx="91" cy="44" r="3.4" fill="white" />
      <circle cx="82" cy="53" r="3.4" fill="white" />
      <circle cx="73" cy="62" r="3.4" fill="white" />
      <circle cx="91" cy="62" r="3.4" fill="white" />
      <defs>
        <linearGradient id="multiDie" x1="62" y1="34" x2="100" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D6A85A" />
          <stop offset="1" stopColor="#2F6F73" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StatsMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <ellipse cx="80" cy="99" rx="48" ry="9" fill="rgba(15,23,42,0.28)" />
      <path d="M50 26h60v18c0 22-13 38-30 38S50 66 50 44V26Z" fill="url(#statsCup)" />
      <path d="M50 36H32c1 20 10 31 25 33M110 36h18c-1 20-10 31-25 33" stroke="#FDE68A" strokeWidth="8" strokeLinecap="round" />
      <rect x="66" y="81" width="28" height="10" rx="5" fill="#F59E0B" />
      <rect x="52" y="91" width="56" height="10" rx="5" fill="#92400E" />
      <rect x="18" y="71" width="14" height="26" rx="5" fill="rgba(251,191,36,0.72)" />
      <rect x="126" y="56" width="14" height="41" rx="5" fill="rgba(251,191,36,0.54)" />
      <rect x="34" y="61" width="14" height="36" rx="5" fill="rgba(124,183,174,0.46)" />
      <path d="M80 38l4.8 9.6 10.6 1.6-7.7 7.4 1.8 10.4-9.5-5-9.5 5 1.8-10.4-7.7-7.4 10.6-1.6L80 38Z" fill="#FFFBEB" />
      <path d="M118 22c8 5 13 12 15 22" stroke="rgba(255,255,255,0.32)" strokeWidth="5" strokeLinecap="round" />
      <defs>
        <linearGradient id="statsCup" x1="52" y1="30" x2="108" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.48" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SettingsMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <ellipse cx="80" cy="99" rx="50" ry="9" fill="rgba(15,23,42,0.26)" />
      <rect x="30" y="22" width="100" height="76" rx="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <rect x="44" y="37" width="72" height="10" rx="5" fill="rgba(255,255,255,0.16)" />
      <rect x="44" y="63" width="72" height="10" rx="5" fill="rgba(255,255,255,0.16)" />
      <rect x="44" y="79" width="39" height="8" rx="4" fill="rgba(214,168,90,0.36)" />
      <circle cx="69" cy="42" r="12" fill="#D6A85A" />
      <circle cx="100" cy="68" r="12" fill="#7CB7AE" />
      <path d="M117 23l3 6 7 1-5 5 1 7-6-3.3-6 3.3 1-7-5-5 7-1 3-6Z" fill="rgba(214,168,90,0.78)" />
      <path d="M34 27c-5 7-7 15-6 25" stroke="rgba(255,255,255,0.25)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

type NavTileProps = {
  href: string;
  area: string;
  tone: "multi" | "stats" | "solo" | "settings";
  title: string;
  subtitle: string;
  badge: string;
  cta: string;
  icon: (props: { className: string }) => ReactNode;
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
  icon,
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
        {icon({ className: "home-bento-motif" })}
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
            <strong>{recordSummaryLabel}</strong>
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
          icon={(p) => <MultiMotif {...p} />}
        />
        <NavTile
          href="/stats"
          area="stats"
          tone="stats"
          title="Statistik"
          subtitle="Rekorde, Duelle und Erfolge auf einen Blick."
          badge="Rangliste"
          cta="Erfolge ansehen"
          icon={(p) => <StatsMotif {...p} />}
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
          icon={(p) => <SoloMotif {...p} />}
        />
        <NavTile
          href="/settings"
          area="settings"
          tone="settings"
          title="Einstellungen"
          subtitle="Standards für Solo, Multiplayer und Tischmodus."
          badge="App"
          cta="Defaults setzen"
          icon={(p) => <SettingsMotif {...p} />}
        />
      </div>

    </div>
  );
}
