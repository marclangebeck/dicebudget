"use client";

import { useEffect, useState } from "react";
import {
  getBonusCelebrationEnabled,
  setBonusCelebrationEnabled,
} from "@/lib/uiPrefs";

type Props = {
  disabled?: boolean;
};

/** Geräte-Einstellung (lokal): Bonus-Einblendung beim Erreichen des oberen Bonus. */
export function BonusCelebrationToggle({ disabled }: Props) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(getBonusCelebrationEnabled());
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setBonusCelebrationEnabled(next);
  }

  return (
    <div className="setup-mode-toggle">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-strong text-sm font-semibold">Bonus-Einblendung</p>
          <p className="text-muted mt-0.5 text-xs leading-snug">
            Kurze Glückwunsch-Animation, wenn eine obere Reihe den Bonus (ab 63) erreicht
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={
            enabled ? "Bonus-Einblendung ausschalten" : "Bonus-Einblendung einschalten"
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
