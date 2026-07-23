"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { APP_TOUR_STEPS } from "@/lib/appTourSteps";
import { setAppTourPrefs } from "@/lib/appTourPrefs";

type Props = {
  open: boolean;
  onClose: () => void;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function AppTourOverlay({ open, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const steps = APP_TOUR_STEPS;
  const step = steps[stepIndex] ?? steps[0]!;
  const isLast = stepIndex >= steps.length - 1;
  const progressLabel = `${stepIndex + 1} / ${steps.length}`;

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setDontShowAgain(false);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setSpotlight(null);
      return;
    }

    function measure() {
      const selector = step.anchor;
      if (!selector) {
        setSpotlight(null);
        return;
      }
      const el = document.querySelector(selector);
      if (!(el instanceof HTMLElement)) {
        setSpotlight(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      const pad = 8;
      setSpotlight({
        top: Math.max(8, rect.top - pad),
        left: Math.max(8, rect.left - pad),
        width: Math.min(window.innerWidth - 16, rect.width + pad * 2),
        height: Math.min(window.innerHeight - 16, rect.height + pad * 2),
      });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step.anchor, stepIndex]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  function finish() {
    if (dontShowAgain) {
      setAppTourPrefs({ dontShowAgain: true });
    }
    onClose();
  }

  function goNext() {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((value) => Math.min(steps.length - 1, value + 1));
  }

  function goBack() {
    setStepIndex((value) => Math.max(0, value - 1));
  }

  return (
    <div className="app-tour" role="dialog" aria-modal="true" aria-labelledby="app-tour-title">
      <div className="app-tour-backdrop" aria-hidden />
      {spotlight && (
        <div
          className="app-tour-spotlight"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          aria-hidden
        />
      )}

      <div className={`app-tour-card${spotlight ? " app-tour-card--anchored" : ""}`}>
        <p className="app-tour-progress">{progressLabel}</p>
        <h2 id="app-tour-title" className="app-tour-title">
          {step.title}
        </h2>
        <p className="app-tour-body">{step.body}</p>

        {isLast && (
          <label className="app-tour-check">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Tour nicht erneut anzeigen</span>
          </label>
        )}

        <div className="app-tour-actions">
          <button type="button" className="app-tour-btn app-tour-btn--ghost" onClick={finish}>
            Überspringen
          </button>
          <div className="app-tour-actions-main">
            {stepIndex > 0 && (
              <button type="button" className="app-tour-btn app-tour-btn--secondary" onClick={goBack}>
                Zurück
              </button>
            )}
            <button type="button" className="app-tour-btn app-tour-btn--primary" onClick={goNext}>
              {isLast ? "Fertig" : "Weiter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
