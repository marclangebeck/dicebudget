"use client";

import { useEffect, useState } from "react";
import {
  getGameFeedbackEnabled,
  setGameFeedbackEnabled,
} from "@/lib/uiPrefs";

type Props = {
  disabled?: boolean;
};

/** Geräte-Einstellung (lokal): Spiel-Feedback (Animation + Sound). */
export function BonusCelebrationToggle({ disabled }: Props) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(getGameFeedbackEnabled());
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setGameFeedbackEnabled(next);
  }

  return (
    <div className="setup-mode-toggle">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-strong text-sm font-semibold">Spiel-Feedback</p>
          <p className="text-muted mt-0.5 text-xs leading-snug">
            Kurze Erfolgs-Animation und Sound bei Bonus, unterer Spalte, Große Straße und Alle Fünfe
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={
            enabled ? "Spiel-Feedback ausschalten" : "Spiel-Feedback einschalten"
          }
          disabled={disabled}
          onClick={toggle}
          className="app-toggle relative h-8 w-14 shrink-0 rounded-full border-2 transition disabled:opacity-50"
        >
          <span
            className={`absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
              enabled ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
