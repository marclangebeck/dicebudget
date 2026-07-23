"use client";

import Link from "next/link";
import { HomeHeroBanner } from "@/components/HomeHeroBanner";
import { JoinByCodeForm } from "@/components/JoinByCodeForm";
import { useHomeHeroData } from "@/lib/useHomeHeroData";

type ArenaPaneProps = {
  href: string;
  tone: "multi" | "solo";
  label: string;
  tagline: string;
  badges: string[];
  cta: string;
  iconSrc: string;
};

function ArenaPane({ href, tone, label, tagline, badges, cta, iconSrc }: ArenaPaneProps) {
  return (
    <Link
      href={href}
      className={`home-arena-pane home-bento-tile home-bento-tile--arena home-bento-tile--${tone} home-arena-pane--${tone} flex min-h-0 flex-col no-underline`}
    >
      <div className="home-bento-scene" aria-hidden />
      <div className="home-arena-pane-head">
        <span className="home-arena-pane-label">{label}</span>
        <p className="home-arena-pane-tagline">{tagline}</p>
        <div className="home-arena-pane-badges">
          {badges.map((badge) => (
            <span key={badge} className="home-arena-pane-badge">
              {badge}
            </span>
          ))}
        </div>
      </div>
      <div className="home-arena-pane-hero">
        <img src={iconSrc} alt="" className="home-bento-motif" loading="eager" decoding="async" />
      </div>
      <span className="home-arena-pane-cta home-bento-play-btn">{cta}</span>
    </Link>
  );
}

/** Ursprünglicher Startscreen (Arena-Kacheln + Hero) — per Layout-Switch wiederherstellbar. */
export function HomeBentoGridClassic() {
  const hero = useHomeHeroData();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">
      <HomeHeroBanner {...hero} />

      <div className="home-play-arena home-play-arena--with-join min-h-0 flex-1">
        <ArenaPane
          href="/multi"
          tone="multi"
          label="Multi-Spiel als Host starten"
          tagline="Raum erstellen, Code teilen, Rivalen schlagen."
          badges={["2–6 Spieler", "Duell"]}
          cta="Als Host starten"
          iconSrc="/home-icons/multiplayer.png"
        />
        <JoinByCodeForm variant="home" />
        <ArenaPane
          href="/solo"
          tone="solo"
          label="Solo"
          tagline="Pool, Bonus, Alle Fünfe — in deinem Tempo."
          badges={["Strategy", "Einzel-Run"]}
          cta="Run starten"
          iconSrc="/home-icons/solo.png"
        />
      </div>
    </div>
  );
}
