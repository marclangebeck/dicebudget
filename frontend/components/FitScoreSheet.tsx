"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Neu berechnen wenn sich Spaltenanzahl o. Ä. ändert. */
  layoutKey: string | number;
};

/** Obere Grenze beim Hochskalieren (Tablets/hohe Displays). */
const MAX_SCALE_UP = 1.28;

/**
 * Spielzettel an die verfügbare Fläche anpassen:
 * - Zu groß → herunterskalieren (kein Seiten-Scroll).
 * - Platz übrig → proportional hochskalieren (Schrift + Zellen wachsen mit).
 */
export function FitScoreSheet({ children, layoutKey }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const fit = () => {
      inner.style.transform = "none";
      inner.style.width = "100%";
      inner.style.height = "auto";

      const cw = host.clientWidth;
      const ch = host.clientHeight;
      if (cw <= 0 || ch <= 0) return;

      const tw = inner.scrollWidth;
      const th = inner.scrollHeight;
      if (tw <= 0 || th <= 0) return;

      const raw = Math.min(cw / tw, ch / th);
      const s = Math.min(raw, MAX_SCALE_UP);

      if (s < 0.995) {
        // Zu groß → herunterskalieren.
        inner.style.transform = `scale(${s})`;
        inner.style.width = `${100 / s}%`;
        inner.style.height = "auto";
      } else if (s > 1.01) {
        // Platz übrig → proportional vergrößern (inkl. Schrift).
        inner.style.transform = `scale(${s})`;
        inner.style.width = `${100 / s}%`;
        inner.style.height = "auto";
      } else {
        // Fast 1:1 → volle Höhe füllen, Zeilen wachsen lassen.
        inner.style.transform = "none";
        inner.style.width = "100%";
        inner.style.height = "100%";
      }
    };

    fit();

    const ro = new ResizeObserver(fit);
    ro.observe(host);

    const onOrientation = () => window.setTimeout(fit, 100);
    window.addEventListener("orientationchange", onOrientation);
    window.visualViewport?.addEventListener("resize", fit);

    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", onOrientation);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, [layoutKey]);

  return (
    <div
      ref={hostRef}
      className="score-sheet-fit-host min-h-0 w-full flex-1 touch-none select-none"
    >
      <div
        ref={innerRef}
        className="score-sheet-fit-inner h-full w-full origin-top"
      >
        {children}
      </div>
    </div>
  );
}
