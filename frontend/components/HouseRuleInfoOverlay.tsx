"use client";

import type { HouseRuleInfo } from "@/lib/houseRuleInfo";

type Props = {
  info: HouseRuleInfo | null;
  onClose: () => void;
};

export function HouseRuleInfoOverlay({ info, onClose }: Props) {
  if (!info) return null;

  return (
    <div
      className="rule-event-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="house-rule-info-title"
    >
      <button
        type="button"
        className="rule-event-overlay-backdrop"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div className="rule-event-card relative z-10 text-center">
        <p className="rule-event-kicker">Regel-Info</p>
        <h2 id="house-rule-info-title" className="rule-event-title">
          {info.title}
        </h2>
        <p className="rule-event-sub text-left">{info.body}</p>
        <button
          type="button"
          className="glass-button mt-4 min-h-10 px-5 text-sm font-semibold"
          onClick={onClose}
        >
          Verstanden
        </button>
      </div>
    </div>
  );
}
