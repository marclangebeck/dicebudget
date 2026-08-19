"use client";

import { useEffect, useRef, useState } from "react";

export const GENTLE_AUTO_REFRESH_MS = 45_000;
export const GENTLE_AUTO_REFRESH_MAX_BACKOFF_MS = 300_000;

type Options = {
  enabled: boolean;
  intervalMs?: number;
  onRefresh: () => Promise<boolean>;
};

export function useGentleAutoRefresh({
  enabled,
  intervalMs = GENTLE_AUTO_REFRESH_MS,
  onRefresh,
}: Options) {
  const [paused, setPaused] = useState(false);
  const [effectiveIntervalMs, setEffectiveIntervalMs] = useState(intervalMs);
  const onRefreshRef = useRef(onRefresh);
  const failuresRef = useRef(0);

  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) {
      failuresRef.current = 0;
      setPaused(false);
      setEffectiveIntervalMs(intervalMs);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = (delayMs: number) => {
      clearTimer();
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      timer = setTimeout(() => {
        void tick();
      }, delayMs);
    };

    const tick = async () => {
      if (cancelled || document.visibilityState === "hidden") return;

      const ok = await onRefreshRef.current();
      if (cancelled) return;

      if (ok) {
        failuresRef.current = 0;
        setPaused(false);
        setEffectiveIntervalMs(intervalMs);
        schedule(intervalMs);
        return;
      }

      failuresRef.current += 1;
      const nextDelay = Math.min(
        intervalMs * 2 ** failuresRef.current,
        GENTLE_AUTO_REFRESH_MAX_BACKOFF_MS,
      );
      setPaused(true);
      setEffectiveIntervalMs(nextDelay);
      schedule(nextDelay);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearTimer();
        return;
      }
      if (enabled) schedule(400);
    };

    schedule(intervalMs);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs]);

  return { paused, effectiveIntervalMs };
}
