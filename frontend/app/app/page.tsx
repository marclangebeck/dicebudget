"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppIntroSplash } from "@/components/AppIntroSplash";
import { AppTourOverlay } from "@/components/AppTourOverlay";
import { HomeBentoGrid } from "@/components/HomeBentoGrid";
import { PlayerNameSetup } from "@/components/PlayerNameSetup";
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
import { hasCompletedOwnNameSetup } from "@/lib/ownPlayerName";

const INTRO_SHOWN_KEY = "dicebudget.introShown.v2";
const INTRO_DURATION_MS = 1700;

type TourLaunch = {
  chapter: AppTourChapterId;
  chain: boolean;
};

type TourRequest = AppTourChapterId | "all";

function launchFromRequest(chapter: TourRequest): TourLaunch {
  if (chapter === "all") return { chapter: "start", chain: true };
  return { chapter, chain: false };
}

function AppHomePageInner() {
  const searchParams = useSearchParams();
  const [showIntro, setShowIntro] = useState(false);
  const [introProgress, setIntroProgress] = useState(0);
  const [tourLaunch, setTourLaunch] = useState<TourLaunch | null>(null);
  const [needsNameSetup, setNeedsNameSetup] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const tourTimerRef = useRef<number | null>(null);
  const skipAutoStartRef = useRef(false);
  const pendingTourRef = useRef<TourRequest | null>(null);

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

  function openTour(chapter: TourRequest) {
    skipAutoStartRef.current = true;
    setShowIntro(false);
    clearTourTimers();
    setTourLaunch(launchFromRequest(chapter));
  }

  function startAutoTourIfReady() {
    if (skipAutoStartRef.current) return;
    if (!hasCompletedOwnNameSetup()) return;
    if (!shouldAutoStartAppTour()) return;
    tourTimerRef.current = window.setTimeout(() => {
      if (skipAutoStartRef.current) return;
      if (!hasCompletedOwnNameSetup()) return;
      setTourLaunch({ chapter: "start", chain: true });
    }, 380);
  }

  function requestNameOrContinue(afterName?: TourRequest) {
    if (!hasCompletedOwnNameSetup()) {
      if (afterName) pendingTourRef.current = afterName;
      setNeedsNameSetup(true);
      return;
    }
    if (afterName) {
      openTour(afterName);
      return;
    }
    startAutoTourIfReady();
  }

  function finishNameSetup() {
    setNeedsNameSetup(false);
    const pending = pendingTourRef.current;
    pendingTourRef.current = null;
    if (pending) {
      openTour(pending);
      return;
    }
    startAutoTourIfReady();
  }

  useEffect(() => {
    return subscribeAppTourRequest((chapter) => {
      if (!hasCompletedOwnNameSetup()) {
        pendingTourRef.current = chapter;
        setNeedsNameSetup(true);
        return;
      }
      openTour(chapter);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pending = consumePendingAppTour();
    const fromUrl = parseAppTourChapterParam(searchParams.get("tour"));
    const request = pending ?? fromUrl;
    if (!request) return;
    requestNameOrContinue(request);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      requestNameOrContinue();
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
          requestNameOrContinue();
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
      {!showIntro && needsNameSetup && <PlayerNameSetup onDone={finishNameSetup} />}
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
