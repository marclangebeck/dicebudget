"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { APP_SHORT } from "@/lib/branding";
import { HomeJoinButtons } from "@/components/JoinByQrScan";

type CinematicDoorProps = {
  href: string;
  tone: "multi" | "solo";
  label: string;
  chip: string;
  cta: string;
  iconSrc: string;
  enterDelayMs: number;
};

function CinematicDoor({
  href,
  tone,
  label,
  chip,
  cta,
  iconSrc,
  enterDelayMs,
}: CinematicDoorProps) {
  return (
    <Link
      href={href}
      className={`home-cinematic-door home-cinematic-door--${tone} home-cinematic-door--editorial home-cinematic-door--hit home-bento-tile home-bento-tile--arena home-bento-tile--${tone} no-underline`}
      style={{ "--home-cinematic-enter-delay": `${enterDelayMs}ms` } as CSSProperties}
      data-tour-anchor={tone === "multi" ? "host" : tone === "solo" ? "solo" : undefined}
      aria-label={`${label}. ${cta}`}
    >
      <div className="home-bento-scene home-cinematic-door-scene" aria-hidden />
      <div className="home-cinematic-door-poster">
        <div className="home-cinematic-door-visual" aria-hidden>
          <div className="home-cinematic-door-motif-wrap">
            <img src={iconSrc} alt="" className="home-bento-motif" loading="eager" decoding="async" />
          </div>
        </div>
        <div className="home-cinematic-door-copy">
          <span className="home-cinematic-door-chip">{chip}</span>
          <span className="home-cinematic-door-label">{label}</span>
          <span className="home-cinematic-door-cta">{cta}</span>
        </div>
      </div>
    </Link>
  );
}

/** Cinematic Doors — Multi/Solo; Beitritt per QR in der Mitte. */
export function HomeBentoGridCinematic() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`home-cinematic flex min-h-0 flex-1 flex-col overflow-hidden ${entered ? "home-cinematic--entered" : ""}`}
    >
      <header className="home-cinematic-brand shrink-0">
        <h1 className="home-cinematic-brand-title">{APP_SHORT}</h1>
        <p className="home-cinematic-brand-sub">Strategy</p>
      </header>

      <div className="home-cinematic-doors min-h-0 flex-1">
        <CinematicDoor
          href="/multi"
          tone="multi"
          label="Multi"
          chip="Host · 2–6"
          cta="Raum starten"
          iconSrc="/home-icons/multiplayer.png"
          enterDelayMs={70}
        />
        <HomeJoinButtons />
        <CinematicDoor
          href="/solo"
          tone="solo"
          label="Solo"
          chip="Einzel"
          cta="Run starten"
          iconSrc="/home-icons/solo.png"
          enterDelayMs={180}
        />
      </div>
    </div>
  );
}
