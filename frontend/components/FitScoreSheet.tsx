"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Neu berechnen wenn sich Spaltenanzahl o. Ä. ändert. */
  layoutKey: string | number;
};

/**
 * Spielzettel an die verfügbare Fläche anpassen:
 * - Passt der Zettel in seiner Mindesthöhe hinein, **füllt** er die volle Höhe
 *   (die Zeilen wachsen; siehe `.play-score-table` in `globals.css`).
 * - Ist er zu groß (sehr kleine/quere Screens), wird **herunterskaliert**, damit
 *   nichts scrollt (Milestone-20-Garantie „ohne Seiten-Scroll").
 */
export function FitScoreSheet({ children, layoutKey }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const fit = () => {
      // Auf natürliche Mindestgröße zurücksetzen, um auszumessen.
      inner.style.transform = "none";
      inner.style.width = "100%";
      inner.style.height = "auto";

      const cw = host.clientWidth;
      const ch = host.clientHeight;
      if (cw <= 0 || ch <= 0) return;

      const tw = inner.scrollWidth;
      const th = inner.scrollHeight;
      if (tw <= 0 || th <= 0) return;

      if (th > ch || tw > cw) {
        // Zu groß → herunterskalieren (kein Scroll).
        const s = Math.min(1, cw / tw, ch / th);
        inner.style.transform = s < 1 ? `scale(${s})` : "none";
        inner.style.width = s < 1 ? `${100 / s}%` : "100%";
        inner.style.height = "auto";
      } else {
        // Platz übrig → volle Höhe füllen, Zeilen wachsen lassen.
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
