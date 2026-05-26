"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Neu berechnen wenn sich Spaltenanzahl o. Ä. ändert. */
  layoutKey: string | number;
};

/**
 * Skaliert den Zettel auf die verfügbare Fläche (max. 100 %, nie größer als der Screen).
 */
export function FitScoreSheet({ children, layoutKey }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [hostHeight, setHostHeight] = useState<number | undefined>(undefined);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const fit = () => {
      inner.style.transform = "none";
      inner.style.width = "100%";

      const cw = host.clientWidth;
      const ch = host.clientHeight;
      if (cw <= 0 || ch <= 0) return;

      const tw = inner.scrollWidth;
      const th = inner.scrollHeight;
      if (tw <= 0 || th <= 0) return;

      const s = Math.min(1, cw / tw, ch / th);
      setScale(s);
      setHostHeight(Math.floor(th * s));
    };

    fit();

    const ro = new ResizeObserver(fit);
    ro.observe(host);
    ro.observe(inner);

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
      style={hostHeight !== undefined ? { height: hostHeight, flex: "none" } : undefined}
    >
      <div
        ref={innerRef}
        className="score-sheet-fit-inner w-full origin-top"
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          width: scale < 1 ? `${100 / scale}%` : "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
