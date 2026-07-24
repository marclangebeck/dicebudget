"use client";

import type { RuleEventOverlayState } from "@/lib/ruleEventFeedback";

type Props = {
  event: RuleEventOverlayState;
  onClose: () => void;
};

export function RuleEventOverlay({ event, onClose }: Props) {
  return (
    <div
      className="rule-event-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-event-title"
    >
      <button
        type="button"
        className="rule-event-overlay-backdrop"
        aria-label="Hinweis schließen"
        onClick={onClose}
      />
      <div className="rule-event-card relative z-10 text-center">
        <p className="rule-event-kicker">Hausregel</p>
        <p className="rule-event-badge tabular-nums">{event.badge}</p>
        <h2 id="rule-event-title" className="rule-event-title">
          {event.title}
        </h2>
        <p className="rule-event-sub">{event.subtitle}</p>
        <button
          type="button"
          className="glass-button mt-4 min-h-10 px-5 text-sm font-semibold"
          onClick={onClose}
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
