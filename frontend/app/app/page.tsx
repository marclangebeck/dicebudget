"use client";

import { useEffect, useRef, useState } from "react";
import { AppIntroSplash } from "@/components/AppIntroSplash";
import { AppTourOverlay } from "@/components/AppTourOverlay";
import { HomeBentoGrid } from "@/components/HomeBentoGrid";
import { ResumeActiveGame } from "@/components/ResumeActiveGame";
import { shouldAutoStartAppTour } from "@/lib/appTourPrefs";

const INTRO_SHOWN_KEY = "dicebudget.introShown.v2";
const INTRO_DURATION_MS = 1700;

export default function AppHomePage() {
  const [showIntro, setShowIntro] = useState(false);
  const [introProgress, setIntroProgress] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const tourTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "1") {
      setTourOpen(true);
      return;
    }

    const alreadyShown = window.sessionStorage.getItem(INTRO_SHOWN_KEY) === "1";
    if (alreadyShown) {
      if (shouldAutoStartAppTour()) {
        tourTimerRef.current = window.setTimeout(() => setTourOpen(true), 450);
      }
      return;
    }

    setShowIntro(true);
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / INTRO_DURATION_MS) * 100);
      setIntroProgress(pct);
      if (pct < 100) {
        raf = window.requestAnimationFrame(tick);
      } else {
        window.sessionStorage.setItem(INTRO_SHOWN_KEY, "1");
        hideTimerRef.current = window.setTimeout(() => {
          setShowIntro(false);
          if (shouldAutoStartAppTour()) {
            tourTimerRef.current = window.setTimeout(() => setTourOpen(true), 380);
          }
        }, 180);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
      if (tourTimerRef.current !== null) {
        window.clearTimeout(tourTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <main className="home-screen-main pt-safe mx-auto flex h-full min-h-0 w-full max-w-lg flex-col gap-3 overflow-hidden px-4 py-4">
        <ResumeActiveGame variant="bento" />
        <HomeBentoGrid />
      </main>
      {showIntro && <AppIntroSplash progress={introProgress} />}
      <AppTourOverlay open={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
