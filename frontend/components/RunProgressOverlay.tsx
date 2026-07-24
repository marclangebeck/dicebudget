"use client";

import {
  progressPositionLabel,
  progressScoreDeltaLabel,
  type ProgressMilestonePercent,
  type ProgressPositionHint,
} from "@/lib/runProgressFeedback";

type Props = {
  percent: ProgressMilestonePercent;
  positionHint?: ProgressPositionHint | null;
  scoreDelta?: number | null;
  onClose: () => void;
};

export function RunProgressOverlay({ percent, positionHint, scoreDelta, onClose }: Props) {
  const positionLabel = progressPositionLabel(positionHint);
  const deltaLabel = progressScoreDeltaLabel(positionHint, scoreDelta);

  return (
    <div
      className="run-progress-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-progress-title"
    >
      <button
        type="button"
        className="run-progress-overlay-backdrop"
        aria-label="Hinweis schließen"
        onClick={onClose}
      />
      <div className="run-progress-card relative z-10 text-center">
        <p className="run-progress-kicker">Fortschritt</p>
        <p id="run-progress-title" className="run-progress-value tabular-nums">
          {percent}%
        </p>
        <p className="run-progress-title">absolviert</p>
        {positionLabel ? (
          <>
            <p className="run-progress-position">{positionLabel}</p>
            {deltaLabel && <p className="run-progress-delta tabular-nums">{deltaLabel}</p>}
          </>
        ) : (
          <p className="run-progress-sub">Weiter so — du bist auf Kurs.</p>
        )}
        <button type="button" className="glass-button mt-4 min-h-10 px-5 text-sm font-semibold" onClick={onClose}>
          Weiter
        </button>
      </div>
    </div>
  );
}
