"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getStats } from "@/lib/api";
import { normalizeInviteCode } from "@/lib/activeGame";
import { APP_SHORT } from "@/lib/branding";
import type { StatsDto } from "@/lib/statsTypes";

function IconSolo({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMulti({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="2.75" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 19c0-2.8 2.2-5 5-5M15 19c0-2.2 1.8-4 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconStats({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 18V10M10 18V6M15 18v-5M20 18V8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconJoin({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M8 11h8M12 8v6M7 5h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

type NavTileProps = {
  href: string;
  area: string;
  tone: "sky" | "primary" | "neutral" | "violet";
  iconSize?: "lg" | "md";
  title: string;
  subtitle: string;
  icon: (props: { className: string }) => ReactNode;
  footer?: ReactNode;
};

function NavTile({
  href,
  area,
  tone,
  iconSize = "md",
  title,
  subtitle,
  icon,
  footer,
}: NavTileProps) {
  const iconClass =
    iconSize === "lg" ? "home-bento-icon home-bento-icon--lg" : "home-bento-icon home-bento-icon--md";

  return (
    <Link
      href={href}
      className={`home-bento-tile home-bento-tile--${tone} flex min-h-0 flex-col no-underline`}
      style={{ gridArea: area }}
    >
      <span className="home-bento-tile-arrow" aria-hidden>
        →
      </span>
      <div className="home-bento-icon-wrap">
        {icon({ className: iconClass })}
      </div>
      <div className="home-bento-tile-footer shrink-0 text-center">
        <p className="text-strong text-base font-semibold leading-tight">{title}</p>
        <p className="text-muted mt-0.5 text-[11px] leading-snug">{subtitle}</p>
        {footer}
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
        <IconJoin className="home-bento-icon home-bento-icon--md" />
        <p className="text-strong text-sm font-semibold">Raum beitreten</p>
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
          Zur Lobby
        </button>
        {error && <p className="text-center text-xs font-medium text-red-800">{error}</p>}
      </form>
    </div>
  );
}

export function HomeBentoGrid() {
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    void getStats()
      .then(({ stats: data }) => setStats(data))
      .catch((e) =>
        setStatsError(e instanceof Error ? e.message : "Statistik nicht geladen"),
      );
  }, []);

  const statsFooter =
    statsError !== null ? (
      <p className="text-[10px] font-medium text-red-800 mt-1">—</p>
    ) : stats === null ? (
      <p className="text-muted mt-2 text-[10px]">Lade …</p>
    ) : stats.finishedRuns === 0 ? (
      <p className="text-muted mt-2 text-xs">Noch kein Rekord</p>
    ) : (
      <p className="home-bento-stat-value mt-1 tabular-nums">{stats.bestTotalScore}</p>
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="home-hero-banner shrink-0">
        <img
          src="/apple-touch-icon.png"
          alt=""
          width={64}
          height={64}
          className="home-hero-logo"
          decoding="async"
        />
        <div className="home-hero-copy min-w-0">
          <p className="home-hero-kicker">Willkommen bei</p>
          <h1 className="text-strong text-2xl font-bold tracking-tight">{APP_SHORT}</h1>
          <p className="text-muted text-sm">Strategy Edition</p>
        </div>
      </header>

      <div className="home-bento-grid min-h-0 flex-1">
        <NavTile
          href="/multi"
          area="multi"
          tone="primary"
          iconSize="lg"
          title="Raum erstellen"
          subtitle="Host · Code für Gäste"
          icon={(p) => <IconMulti {...p} />}
        />
        <NavTile
          href="/stats"
          area="stats"
          tone="violet"
          title="Statistik"
          subtitle="Paarungen & Rekorde"
          icon={(p) => <IconStats {...p} />}
          footer={statsFooter}
        />
        <NavTile
          href="/solo"
          area="solo"
          tone="sky"
          title="Einzelspiel"
          subtitle="Spielanzahl & Modus wählen"
          icon={(p) => <IconSolo {...p} />}
        />
        <JoinTile />
      </div>
    </div>
  );
}
