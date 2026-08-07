"use client";

import { useEffect, useRef } from "react";

/**
 * Ruft `onRefresh` auf, wenn die App wieder sichtbar/fokussiert wird
 * (Tab-Wechsel, App aus Hintergrund). Debounced, nur bei visible.
 */
export function useForegroundRefresh(onRefresh: () => void): void {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        onRefreshRef.current();
      }, 200);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) schedule();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", schedule);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", schedule);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
}
