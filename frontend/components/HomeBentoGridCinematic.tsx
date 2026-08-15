"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { APP_SHORT } from "@/lib/branding";
import { HomeJoinButtons } from "@/components/JoinByQrScan";

type CinematicDoorProps = {
  href: string;
  tone: "multi" | "solo";
  label: string;
  tagline: string;
  chip: string;
  cta: string;
  iconSrc: string;
  enterDelayMs: number;
  labelClassName?: string;
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
  labelClassName,
}: CinematicDoorProps) {
  return (
    <Link
      href={href}
      className={`home-cinematic-door home-cinematic-door--${tone} home-cinematic-door--editorial home-bento-tile home-bento-tile--arena home-bento-tile--${tone} no-underline`}
      style={{ "--home-cinematic-enter-delay": `${enterDelayMs}ms` } as CSSProperties}
      data-tour-anchor={tone === "multi" ? "host" : tone === "solo" ? "solo" : undefined}
    >
      <div className="home-bento-scene home-cinematic-door-scene" aria-hidden />
      <div className="home-cinematic-door-poster">
        <div className="home-cinematic-door-copy">
          <span className="home-cinematic-door-chip">{chip}</span>
          <span className={`home-cinematic-door-label${labelClassName ? ` ${labelClassName}` : ""}`}>
            {label}
          </span>
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

/** Cinematic Doors — Multi/Solo; Beitritt per QR in der Mitte. */
export function HomeBentoGridCinematic() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 60);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`home-cinematic flex min-h-0 flex-1 flex-col overflow-hidden ${entered ? "home-cinematic--entered" : ""}`}
    >
      <div className="home-cinematic-top shrink-0">
        <p className="home-cinematic-kicker">{APP_SHORT} · Strategy Edition</p>
      </div>

      <div className="home-cinematic-doors min-h-0 flex-1">
        <CinematicDoor
          href="/multi"
          tone="multi"
          label="Multi-Spiel als Host starten"
          tagline="Raum erstellen, QR zeigen, Rivalen einladen."
          chip="2–6 Spieler"
          cta="Als Host starten"
          iconSrc="/home-icons/multiplayer.png"
          enterDelayMs={80}
          labelClassName="home-cinematic-door-label--host"
        />
        <HomeJoinButtons />
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
