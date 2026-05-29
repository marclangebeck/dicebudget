"use client";

import { useState } from "react";
import { DiceCountPicker } from "@/components/DiceCountPicker";
import { DiceThrowPreview } from "@/components/DiceThrowPreview";
import { dieCountsTotal, type DieCounts } from "@/lib/scoreFromDice";
import type { RunDto } from "@/lib/types";

type Step = "dice" | "rolls";

type Props = {
  run: RunDto;
  draftCounts: DieCounts;
  rollsUsed: number | null;
  busy: boolean;
  onDraftCountsChange: (counts: DieCounts) => void;
  onRollsUsed: (n: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onManualEntry: () => void;
};

export function DiceThrowOverlay({
  run,
  draftCounts,
  rollsUsed,
  busy,
  onDraftCountsChange,
  onRollsUsed,
  onConfirm,
  onCancel,
  onManualEntry,
}: Props) {
  const [step, setStep] = useState<Step>("dice");

  const strategy = run.useStrategyRules;
  const rollOptions = strategy
    ? [1, 2, 3, ...Array.from({ length: run.rollsInPool }, (_, i) => i + 4)]
    : [1, 2, 3];

  const diceOk = dieCountsTotal(draftCounts) === 5;
  const canConfirmDice = run.status === "ACTIVE" && diceOk && !busy;
  const canConfirmRolls =
    run.status === "ACTIVE" && rollsUsed !== null && diceOk && !busy;

  return (
    <div
      className="dice-throw-overlay fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dice-throw-title"
    >
      <button
        type="button"
        className="dice-throw-overlay-backdrop absolute inset-0"
        aria-label="Schließen"
        onClick={onCancel}
      />

      <div className="dice-throw-card pb-safe relative mx-auto w-full max-w-md px-3 sm:px-4">
        <div className="play-entry-panel play-dice-throw-panel">
          <div className="play-entry-header">
            <div className="min-w-0">
              <p className="dice-throw-step-kicker">
                Schritt {step === "dice" ? "1" : "2"} von 2
              </p>
              <p id="dice-throw-title" className="play-entry-kicker">
                {step === "dice" ? "Wurf einstellen" : "Würfe wählen"}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="play-entry-close"
              aria-label="Abbrechen"
            >
              ✕
            </button>
          </div>

          <DiceThrowPreview counts={draftCounts} compact={step === "rolls"} />

          {step === "dice" ? (
            <>
              <DiceCountPicker
                counts={draftCounts}
                disabled={busy}
                onChange={onDraftCountsChange}
              />

              <div className="play-entry-actions">
                <button
                  type="button"
                  disabled={!canConfirmDice}
                  onClick={() => setStep("rolls")}
                  className="play-entry-btn play-entry-btn--submit disabled:opacity-50"
                >
                  Wurf bestätigen
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="play-entry-section dice-throw-rolls-section">
                <p className="play-entry-section-label mb-1.5">
                  Wie viele Würfe hast du gebraucht?
                </p>
                <div className="play-roll-chips play-roll-chips--large">
                  {rollOptions.map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={run.status !== "ACTIVE" || busy}
                      onClick={() => onRollsUsed(n)}
                      className={`play-roll-chip play-roll-chip--large tabular-nums ${
                        rollsUsed === n ? "play-roll-chip--selected" : ""
                      } disabled:opacity-40`}
                    >
                      <span>{n}</span>
                      {strategy && n > 3 ? (
                        <span className="ml-0.5 opacity-90">·P</span>
                      ) : null}
                    </button>
                  ))}
                </div>
                {strategy ? (
                  <p className="play-entry-hint">1–3 → Pool · ab 4. aus Pool</p>
                ) : (
                  <p className="play-entry-hint">Klassisch: höchstens 3 Würfe pro Feld.</p>
                )}
              </div>

              <div className="play-entry-actions play-entry-actions--split">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep("dice")}
                  className="play-entry-btn play-entry-btn--secondary disabled:opacity-50"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  disabled={!canConfirmRolls}
                  onClick={onConfirm}
                  className="play-entry-btn play-entry-btn--submit disabled:opacity-50"
                >
                  Felder anzeigen
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={onManualEntry}
            className="play-dice-entry-manual-link mt-1 w-full disabled:opacity-50"
          >
            Manuell eintragen
          </button>
        </div>
      </div>
    </div>
  );
}
