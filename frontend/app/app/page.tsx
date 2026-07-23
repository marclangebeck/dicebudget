"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppIntroSplash } from "@/components/AppIntroSplash";
import { AppTourOverlay } from "@/components/AppTourOverlay";
import { HomeBentoGrid } from "@/components/HomeBentoGrid";
import { ResumeActiveGame } from "@/components/ResumeActiveGame";
import {
  consumePendingAppTour,
  shouldAutoStartAppTour,
  subscribeAppTourRequest,
} from "@/lib/appTourPrefs";
import {
  parseAppTourChapterParam,
  type AppTourChapterId,
} from "@/lib/appTourSteps";

const INTRO_SHOWN_KEY = "dicebudget.introShown.v2";
const INTRO_DURATION_MS = 1700;

type TourLaunch = {
  chapter: AppTourChapterId;
  chain: boolean;
};

function launchFromRequest(chapter: AppTourChapterId | "all"): TourLaunch {
  if (chapter === "all") return { chapter: "start", chain: true };
  return { chapter, chain: false };
}

function AppHomePageInner() {
  const searchParams = useSearchParams();
  const [showIntro, setShowIntro] = useState(false);
  const [introProgress, setIntroProgress] = useState(0);
  const [tourLaunch, setTourLaunch] = useState<TourLaunch | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const tourTimerRef = useRef<number | null>(null);
  const skipAutoStartRef = useRef(false);

  function clearTourTimers() {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (tourTimerRef.current !== null) {
      window.clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
  }

  function openTour(chapter: AppTourChapterId | "all") {
    skipAutoStartRef.current = true;
    setShowIntro(false);
    clearTourTimers();
    setTourLaunch(launchFromRequest(chapter));
  }

  // Menü-Event: Tour öffnen, auch wenn /app schon gemountet ist
  useEffect(() => {
    return subscribeAppTourRequest((chapter) => openTour(chapter));
  }, []);

  // Pending (Navigation von anderer Seite) + Deep-Link ?tour=
  useEffect(() => {
    const pending = consumePendingAppTour();
    const fromUrl = parseAppTourChapterParam(searchParams.get("tour"));
    const request = pending ?? fromUrl;
    if (!request) return;
    openTour(request);
  }, [searchParams]);

  // Intro + Auto-Start nur ohne explizite Tour-Anforderung
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (
      skipAutoStartRef.current ||
      parseAppTourChapterParam(searchParams.get("tour")) ||
      window.sessionStorage.getItem("dicebudget.appTour.pending")
    ) {
      return;
    }

    const alreadyShown = window.sessionStorage.getItem(INTRO_SHOWN_KEY) === "1";
    if (alreadyShown) {
      if (shouldAutoStartAppTour()) {
        tourTimerRef.current = window.setTimeout(() => {
          if (skipAutoStartRef.current) return;
          setTourLaunch({ chapter: "start", chain: true });
        }, 450);
      }
      return () => clearTourTimers();
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
          if (shouldAutoStartAppTour() && !skipAutoStartRef.current) {
            tourTimerRef.current = window.setTimeout(() => {
              if (skipAutoStartRef.current) return;
              setTourLaunch({ chapter: "start", chain: true });
            }, 380);
          }
        }, 180);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      clearTourTimers();
    };
    // Nur beim ersten Mount der Home-Seite
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <main className="home-screen-main pt-safe mx-auto flex h-full min-h-0 w-full max-w-lg flex-col gap-3 overflow-hidden px-4 py-4">
        <ResumeActiveGame variant="bento" />
        <HomeBentoGrid />
      </main>
      {showIntro && <AppIntroSplash progress={introProgress} />}
      <AppTourOverlay
        open={tourLaunch !== null}
        chapter={tourLaunch?.chapter ?? "start"}
        chainChapters={tourLaunch?.chain ?? false}
        onClose={() => setTourLaunch(null)}
      />
    </>
  );
}

export default function AppHomePage() {
  return (
    <Suspense fallback={null}>
      <AppHomePageInner />
    </Suspense>
  );
}
