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
      <circle cx="80" cy="60" r="47" fill="rgba(124,183,174,0.12)" />
      <rect x="49" y="29" width="62" height="62" rx="18" fill="url(#soloDie)" />
      <rect x="49" y="29" width="62" height="62" rx="18" stroke="rgba(255,255,255,0.38)" strokeWidth="2" />
      <circle cx="67" cy="47" r="4.5" fill="white" />
      <circle cx="93" cy="47" r="4.5" fill="white" />
      <circle cx="80" cy="60" r="4.5" fill="white" />
      <circle cx="67" cy="73" r="4.5" fill="white" />
      <circle cx="93" cy="73" r="4.5" fill="white" />
      <path d="M43 99h74" stroke="rgba(255,255,255,0.45)" strokeWidth="5" strokeLinecap="round" />
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
      <circle cx="80" cy="60" r="48" fill="rgba(214,168,90,0.1)" />
      <rect x="31" y="35" width="44" height="54" rx="14" fill="rgba(124,183,174,0.24)" stroke="#7CB7AE" strokeWidth="4" />
      <rect x="85" y="35" width="44" height="54" rx="14" fill="rgba(214,168,90,0.2)" stroke="#D6A85A" strokeWidth="4" />
      <path d="M67 60h26" stroke="rgba(255,255,255,0.72)" strokeWidth="5" strokeLinecap="round" />
      <path d="M78 49 89 60 78 71" stroke="rgba(255,255,255,0.72)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="53" cy="53" r="4" fill="#F8FAFC" />
      <circle cx="53" cy="71" r="4" fill="#F8FAFC" />
      <circle cx="107" cy="53" r="4" fill="#F8FAFC" />
      <circle cx="107" cy="71" r="4" fill="#F8FAFC" />
    </svg>
  );
}

function StatsMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <circle cx="80" cy="60" r="47" fill="rgba(214,168,90,0.11)" />
      <rect x="39" y="69" width="18" height="25" rx="7" fill="rgba(124,183,174,0.62)" />
      <rect x="68" y="51" width="18" height="43" rx="7" fill="#D6A85A" />
      <rect x="97" y="35" width="18" height="59" rx="7" fill="rgba(253,230,138,0.88)" />
      <path d="M38 98h84" stroke="rgba(255,255,255,0.42)" strokeWidth="5" strokeLinecap="round" />
      <path d="M50 57 76 39l25 9 20-24" stroke="#FDE68A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="121" cy="24" r="6" fill="#FFFBEB" />
    </svg>
  );
}

function SettingsMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <circle cx="80" cy="60" r="47" fill="rgba(255,255,255,0.08)" />
      <rect x="37" y="31" width="86" height="58" rx="20" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.28)" strokeWidth="3" />
      <path d="M54 48h52M54 72h52" stroke="rgba(255,255,255,0.52)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="72" cy="48" r="11" fill="#D6A85A" />
      <circle cx="96" cy="72" r="11" fill="#7CB7AE" />
      <path d="M123 31 132 40M132 31l-9 9" stroke="rgba(214,168,90,0.78)" strokeWidth="4" strokeLinecap="round" />
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
