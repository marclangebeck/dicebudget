"use client";

import type { ProgressMilestonePercent } from "@/lib/runProgressFeedback";

type Props = {
  percent: ProgressMilestonePercent;
  onClose: () => void;
};

export function RunProgressOverlay({ percent, onClose }: Props) {
  return (
    <div
      className="run-progress-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <div className="run-progress-scene" aria-hidden>
        <div className="run-progress-scene-glow" />
        <div className="run-progress-ring run-progress-ring--outer" />
        <div
          className="run-progress-ring run-progress-ring--inner"
          style={{ "--progress-pct": percent } as React.CSSProperties}
        />
      </div>

      <div
        className="run-progress-card relative z-10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="run-progress-kicker">Fortschritt</p>
        <p className="run-progress-value tabular-nums">{percent}%</p>
        <p className="run-progress-title">absolviert</p>
        <p className="run-progress-sub">Weiter so — du bist auf Kurs.</p>
      </div>
    </div>
  );
}
