"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getPairingSummaries, getStats } from "@/lib/api";
import { normalizeInviteCode } from "@/lib/activeGame";
import { APP_SHORT, CONTACT_EMAIL, IMPRESSUM_PATH, PRIVACY_PATH } from "@/lib/branding";
import { mergePairingSummaries } from "@/lib/pairingMerge";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { getOrCreatePlayerId, normalizePublicPlayerId, playerLabel } from "@/lib/playerIdentity";
import { loadPlayerAliases, type PlayerAliasMap } from "@/lib/playerAliases";
import type { StatsDto } from "@/lib/statsTypes";

function SoloMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <rect x="38" y="17" width="72" height="88" rx="14" fill="rgba(255,255,255,0.9)" />
      <path d="M53 39h40M53 54h40M53 69h30" stroke="#0F766E" strokeWidth="6" strokeLinecap="round" />
      <rect x="92" y="54" width="42" height="42" rx="12" fill="url(#soloDie)" />
      <circle cx="105" cy="67" r="3.5" fill="white" />
      <circle cx="121" cy="67" r="3.5" fill="white" />
      <circle cx="105" cy="83" r="3.5" fill="white" />
      <circle cx="121" cy="83" r="3.5" fill="white" />
      <path d="M32 93c21-14 42-14 63 0" stroke="rgba(255,255,255,0.55)" strokeWidth="5" strokeLinecap="round" />
      <defs>
        <linearGradient id="soloDie" x1="92" y1="54" x2="134" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MultiMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <path d="M28 64c20-30 84-30 104 0" stroke="rgba(255,255,255,0.35)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="44" cy="47" r="15" fill="#67E8F9" />
      <circle cx="116" cy="47" r="15" fill="#C4B5FD" />
      <path d="M19 92c2-20 16-31 35-31s33 11 35 31" fill="rgba(103,232,249,0.86)" />
      <path d="M71 92c2-20 16-31 35-31s33 11 35 31" fill="rgba(196,181,253,0.86)" />
      <rect x="62" y="34" width="38" height="38" rx="11" fill="url(#multiDie)" />
      <circle cx="73" cy="45" r="3.2" fill="white" />
      <circle cx="89" cy="45" r="3.2" fill="white" />
      <circle cx="81" cy="53" r="3.2" fill="white" />
      <circle cx="73" cy="61" r="3.2" fill="white" />
      <circle cx="89" cy="61" r="3.2" fill="white" />
      <defs>
        <linearGradient id="multiDie" x1="62" y1="34" x2="100" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StatsMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <path d="M52 30h56v17c0 20-12 35-28 35S52 67 52 47V30Z" fill="url(#statsCup)" />
      <path d="M52 39H36c1 19 10 29 24 31M108 39h16c-1 19-10 29-24 31" stroke="#FDE68A" strokeWidth="8" strokeLinecap="round" />
      <rect x="67" y="80" width="26" height="10" rx="5" fill="#F59E0B" />
      <rect x="55" y="90" width="50" height="10" rx="5" fill="#92400E" />
      <rect x="21" y="70" width="14" height="26" rx="5" fill="rgba(251,191,36,0.72)" />
      <rect x="125" y="58" width="14" height="38" rx="5" fill="rgba(251,191,36,0.54)" />
      <path d="M80 40l4.5 9 10 1.5-7.2 7 1.7 9.8-9-4.7-9 4.7 1.7-9.8-7.2-7 10-1.5L80 40Z" fill="#FFFBEB" />
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

function JoinMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 160 120" fill="none">
      <rect x="23" y="27" width="114" height="66" rx="18" fill="rgba(255,255,255,0.16)" />
      <rect x="34" y="42" width="92" height="36" rx="12" fill="rgba(15,23,42,0.58)" stroke="rgba(255,255,255,0.25)" />
      <path d="M50 61h14M73 61h14M96 61h14" stroke="#F0ABFC" strokeWidth="7" strokeLinecap="round" />
      <circle cx="42" cy="93" r="8" fill="#A855F7" />
      <circle cx="80" cy="101" r="8" fill="#EC4899" />
      <circle cx="118" cy="93" r="8" fill="#60A5FA" />
      <path d="M50 92c14-11 46-11 60 0" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function HomeLegalFooter() {
  return (
    <footer className="home-legal-footer shrink-0">
      <Link href={PRIVACY_PATH} className="home-legal-link">
        Datenschutz
      </Link>
      <span aria-hidden className="home-legal-sep">
        ·
      </span>
      <Link href={IMPRESSUM_PATH} className="home-legal-link">
        Impressum
      </Link>
      <span aria-hidden className="home-legal-sep">
        ·
      </span>
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("dice.budget Support")}`}
        className="home-legal-link"
      >
        Support
      </a>
    </footer>
  );
}

type NavTileProps = {
  href: string;
  area: string;
  tone: "multi" | "stats" | "solo";
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

function JoinTile() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizeInviteCode(code);
    if (normalized.length < 6) {
      setError("Code zu kurz");
      return;
    }
    setError(null);
    router.push(`/multi/join?code=${encodeURIComponent(normalized)}`);
  }

  return (
    <div className="home-bento-join-bar">
      <div className="home-bento-join-head">
        <div>
          <p className="home-bento-join-kicker">Live-Lobby</p>
          <p className="home-bento-join-title">Raum beitreten</p>
        </div>
        <JoinMotif className="home-bento-join-motif" />
      </div>
      <form onSubmit={handleSubmit} className="home-bento-join-form">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={12}
          placeholder="RAUM-CODE"
          aria-label="Raum-Code"
          className="home-bento-input home-bento-input--lg w-full text-center font-mono"
        />
        <button
          type="submit"
          className="home-bento-submit home-bento-submit--lg w-full font-semibold"
        >
          Beitreten
        </button>
        {error && <p className="home-bento-join-error">{error}</p>}
      </form>
    </div>
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
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <header className="home-hero-banner shrink-0">
        <div className="home-hero-copy">
          <p className="home-hero-kicker">{APP_SHORT} · Strategy Edition</p>
          <h1 className="home-hero-title">Bereit für die nächste Runde?</h1>
          <p className="home-hero-subtitle">Risiko, Timing und Rivalität in jedem Wurf.</p>
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

      <div className="home-bento-grid min-h-0 flex-1">
        <NavTile
          href="/multi"
          area="multi"
          tone="multi"
          title="Raum erstellen"
          subtitle="Starte eine Lobby und lade Mitspieler an den Tisch."
          badge="Multiplayer"
          cta="Neue Runde öffnen"
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
        <JoinTile />
      </div>

      <HomeLegalFooter />
    </div>
  );
}
