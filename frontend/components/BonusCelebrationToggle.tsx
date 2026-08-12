"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  feedbackPrefsSummary,
  getGameFeedbackPrefs,
} from "@/lib/gameFeedbackPrefs";

type Props = {
  disabled?: boolean;
  feedbackHref?: string;
};

/** Verlinkt zu den Einstellungen „Visuelle Einblendungen“. */
export function BonusCelebrationToggle({ disabled, feedbackHref = "/settings/feedback" }: Props) {
  const [summary, setSummary] = useState("Animationen · Sounds · Fortschritt");

  useEffect(() => {
    setSummary(feedbackPrefsSummary(getGameFeedbackPrefs()));
  }, []);

  return (
    <Link
      href={feedbackHref}
      className={`setup-mode-toggle block no-underline${disabled ? " pointer-events-none opacity-50" : ""}`}
      aria-label="Einstellungen Visuelle Einblendungen öffnen"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-strong text-sm font-semibold">Visuelle Einblendungen</p>
          <p className="text-muted mt-0.5 text-xs leading-snug">
            Erfolgsanimationen, Lauffeuer, Sounds und Fortschrittshinweise einzeln steuern
          </p>
          <p className="text-muted mt-1 text-[11px] leading-snug">Aktiv: {summary}</p>
        </div>
        <span className="text-muted shrink-0 text-lg leading-none" aria-hidden>
          ›
        </span>
      </div>
    </Link>
  );
}
