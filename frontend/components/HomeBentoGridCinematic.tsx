"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { APP_SHORT } from "@/lib/branding";
import { HomeHeroBanner } from "@/components/HomeHeroBanner";
import { useHomeHeroData } from "@/lib/useHomeHeroData";

type CinematicDoorProps = {
  href: string;
  tone: "multi" | "solo";
  label: string;
  tagline: string;
  chip: string;
  cta: string;
  iconSrc: string;
  enterDelayMs: number;
};

function CinematicDoor({
  href,
  tone,
  label,
  tagline,
  chip,
  cta,
  iconSrc,
  enterDelayMs,
}: CinematicDoorProps) {
  return (
    <Link
      href={href}
      className={`home-cinematic-door home-cinematic-door--${tone} home-cinematic-door--editorial home-bento-tile home-bento-tile--arena home-bento-tile--${tone} no-underline`}
      style={{ "--home-cinematic-enter-delay": `${enterDelayMs}ms` } as CSSProperties}
    >
      <div className="home-bento-scene home-cinematic-door-scene" aria-hidden />
      <div className="home-cinematic-door-poster">
        <div className="home-cinematic-door-copy">
          <span className="home-cinematic-door-chip">{chip}</span>
          <span className="home-cinematic-door-label">{label}</span>
          <p className="home-cinematic-door-tagline">{tagline}</p>
        </div>
        <div className="home-cinematic-door-stage" aria-hidden>
          <div className="home-cinematic-door-hero">
            <div className="home-cinematic-door-motif-wrap">
              <img src={iconSrc} alt="" className="home-bento-motif" loading="eager" decoding="async" />
            </div>
          </div>
        </div>
        <span className="home-cinematic-door-cta">{cta}</span>
      </div>
    </Link>
  );
}

/** Cinematic Doors — Editorial-Poster für Multi/Solo; Bilanz per Toggle. */
export function HomeBentoGridCinematic() {
  const hero = useHomeHeroData();
  const [statsOpen, setStatsOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 60);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`home-cinematic flex min-h-0 flex-1 flex-col overflow-hidden ${entered ? "home-cinematic--entered" : ""} ${statsOpen ? "home-cinematic--stats-open" : ""}`}
    >
      <div className="home-cinematic-top shrink-0">
        <p className="home-cinematic-kicker">{APP_SHORT} · Strategy Edition</p>
        <button
          type="button"
          className={`home-cinematic-stats-toggle ${statsOpen ? "is-open" : ""}`}
          aria-expanded={statsOpen}
          onClick={() => setStatsOpen((open) => !open)}
        >
          <span className="home-cinematic-stats-toggle-label">
            {hero.recordTitle} · <strong className="tabular-nums">{hero.recordSummaryLabel}</strong>
          </span>
          <span className="home-cinematic-stats-toggle-chevron" aria-hidden />
        </button>
      </div>

      <div
        className={`home-cinematic-stats-panel ${statsOpen ? "is-open" : ""}`}
        aria-hidden={!statsOpen}
      >
        <HomeHeroBanner {...hero} compact />
      </div>

      <div className="home-cinematic-doors min-h-0 flex-1">
        <CinematicDoor
          href="/multi"
          tone="multi"
          label="Multi"
          tagline="Raum erstellen, Code teilen, Rivalen schlagen."
          chip="2–6 Spieler"
          cta="Lobby öffnen"
          iconSrc="/home-icons/multiplayer.png"
          enterDelayMs={80}
        />
        <CinematicDoor
          href="/solo"
          tone="solo"
          label="Solo"
          tagline="Pool, Bonus, Alle Fünfe — in deinem Tempo."
          chip="Einzel-Run"
          cta="Run starten"
          iconSrc="/home-icons/solo.png"
          enterDelayMs={220}
        />
      </div>
    </div>
  );
}
