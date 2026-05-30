"use client";

import { useMemo } from "react";
import { UPPER_BONUS_MIN, UPPER_BONUS_POINTS } from "@/lib/gameScoring";

type Props = {
  /** Spielblock (1-basiert), in dem der Bonus erreicht wurde. */
  gameIndex?: number | null;
  onClose: () => void;
};

const CONFETTI_COLORS = [
  "#10b981",
  "#34d399",
  "#a7f3d0",
  "#fbbf24",
  "#f59e0b",
  "#38bdf8",
  "#f472b6",
];
const CONFETTI_COUNT = 36;

/** Kurze Glückwunsch-Einblendung beim Erreichen des oberen Bonus (M31) mit Konfetti-Regen. */
export function BonusOverlay({ gameIndex, onClose }: Props) {
  // Einmalig berechnen, damit die Schnipsel über die Lebensdauer des Overlays stabil bleiben.
  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 0.9,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.round(Math.random() * 360),
        drift: Math.round((Math.random() - 0.5) * 90),
        width: 6 + Math.random() * 6,
      })),
    [],
  );

  return (
    <div
      className="bonus-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <div className="bonus-confetti" aria-hidden>
        {confetti.map((c, i) => (
          <span
            key={i}
            className="bonus-confetti-piece"
            style={
              {
                left: `${c.left}%`,
                width: `${c.width}px`,
                height: `${c.width * 0.42}px`,
                background: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                "--confetti-rotate": `${c.rotate}deg`,
                "--confetti-drift": `${c.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="bonus-overlay-card relative z-10 text-center">
        <div className="bonus-overlay-badge tabular-nums">+{UPPER_BONUS_POINTS}</div>
        <p className="bonus-overlay-title">Bonus erreicht!</p>
        <p className="bonus-overlay-sub">
          Obere Reihe{gameIndex ? ` (Spiel ${gameIndex})` : ""} ≥ {UPPER_BONUS_MIN} – plus{" "}
          {UPPER_BONUS_POINTS} Punkte
        </p>
      </div>
    </div>
  );
}
