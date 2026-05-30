"use client";

import { UPPER_BONUS_MIN, UPPER_BONUS_POINTS } from "@/lib/gameScoring";

type Props = {
  /** Spielblock (1-basiert), in dem der Bonus erreicht wurde. */
  gameIndex?: number | null;
  onClose: () => void;
};

/** Kurze Glückwunsch-Einblendung beim Erreichen des oberen Bonus (M31). */
export function BonusOverlay({ gameIndex, onClose }: Props) {
  return (
    <div
      className="bonus-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <div className="bonus-overlay-card text-center">
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
