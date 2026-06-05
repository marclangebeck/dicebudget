"use client";

import { MODE_CLASSIC_LABEL, MODE_STRATEGY_LABEL } from "@/lib/branding";

type Props = {
  useStrategyRules: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  variant?: "default" | "setup";
};

/** Standard: Strategy Edition (an). Aus = DiceBudget Klassisch ohne Wurf-Pool. */
export function StrategyModeToggle({
  useStrategyRules,
  onChange,
  disabled,
  variant = "default",
}: Props) {
  const wrapClass =
    variant === "setup" ? "setup-mode-toggle" : "glass-stat flex flex-col gap-2 px-3 py-3";

  return (
    <div className={wrapClass}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-strong text-sm font-semibold">
            {useStrategyRules ? MODE_STRATEGY_LABEL : MODE_CLASSIC_LABEL}
          </p>
          <p className="text-muted mt-0.5 text-xs leading-snug">
            {useStrategyRules
              ? "Wurf-Pool und begrenzte Gesamtwürfe über alle Felder"
              : "Ohne Pool und ohne Wurfzählung – nur Punkte eintragen"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useStrategyRules}
          aria-label={
            useStrategyRules
              ? "Strategy Edition aktiv, auf DiceBudget Klassisch umschalten"
              : "DiceBudget Klassisch aktiv, auf Strategy Edition umschalten"
          }
          disabled={disabled}
          onClick={() => onChange(!useStrategyRules)}
          className="app-toggle relative h-8 w-14 shrink-0 rounded-full border-2 transition disabled:opacity-50"
        >
          <span
            className={`absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
              useStrategyRules ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
