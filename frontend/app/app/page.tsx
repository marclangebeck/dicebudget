"use client";

import { useEffect, useRef, useState } from "react";
import { AppIntroSplash } from "@/components/AppIntroSplash";
import { HomeBentoGrid } from "@/components/HomeBentoGrid";
import { ResumeActiveGame } from "@/components/ResumeActiveGame";

const INTRO_SHOWN_KEY = "dicebudget.introShown.v2";
const INTRO_DURATION_MS = 1700;

export default function AppHomePage() {
  const [showIntro, setShowIntro] = useState(false);
  const [introProgress, setIntroProgress] = useState(0);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyShown = window.sessionStorage.getItem(INTRO_SHOWN_KEY) === "1";
    if (alreadyShown) return;

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
        hideTimerRef.current = window.setTimeout(() => setShowIntro(false), 180);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
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
    </>
  );
}
