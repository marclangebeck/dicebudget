"use client";

import { DiceCountPicker } from "@/components/DiceCountPicker";
import { DiceThrowPreview } from "@/components/DiceThrowPreview";
import { FIELD_LABELS } from "@/lib/labels";
import {
  dieCountsToDiceValues,
  dieCountsTotal,
  fixedRuleScore,
  isFixedRuleField,
  scoreField,
  type DieCounts,
} from "@/lib/scoreFromDice";
import type { FieldDto, RunDto } from "@/lib/types";

export type ThrowOverlayMode = "field" | "compare";

type Props = {
  run: RunDto;
  mode: ThrowOverlayMode;
  targetField: FieldDto | null;
  gameIndex: number | null;
  draftCounts: DieCounts;
  rollsUsed: number | null;
  fixedScore: number | null;
  busy: boolean;
  onDraftCountsChange: (counts: DieCounts) => void;
  onRollsUsed: (n: number) => void;
  onFixedScore: (score: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onManualEntry: () => void;
};

export function DiceThrowOverlay({
  run,
  mode,
  targetField,
  gameIndex,
  draftCounts,
  rollsUsed,
  fixedScore,
  busy,
  onDraftCountsChange,
  onRollsUsed,
  onFixedScore,
  onSubmit,
  onCancel,
  onManualEntry,
}: Props) {
  const strategy = run.useStrategyRules;
  const rollOptions = strategy
    ? [1, 2, 3, ...Array.from({ length: run.rollsInPool }, (_, i) => i + 4)]
    : [1, 2, 3];

  const isFixedField = targetField !== null && isFixedRuleField(targetField.fieldType);
  const fixedValue = targetField ? fixedRuleScore(targetField.fieldType) : null;
  const diceOk = dieCountsTotal(draftCounts) === 5;
  const dice = diceOk ? dieCountsToDiceValues(draftCounts) : null;

  const liveScore =
    mode === "field" && targetField && !isFixedField && dice
      ? scoreField(targetField.fieldType, dice)
      : null;

  const canSubmitField =
    run.status === "ACTIVE" &&
    !busy &&
    rollsUsed !== null &&
    (isFixedField
      ? fixedScore !== null
      : diceOk);

  const canSubmitCompare =
    run.status === "ACTIVE" && !busy && rollsUsed !== null && diceOk;

  const canSubmit = mode === "field" ? canSubmitField : canSubmitCompare;

  const title =
    mode === "field" && targetField && gameIndex !== null
      ? `Sp${gameIndex} · ${FIELD_LABELS[targetField.fieldType]}`
      : mode === "compare"
        ? "Wurf vergleichen"
        : "Eintrag";

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
              <p id="dice-throw-title" className="play-entry-kicker">
                {title}
              </p>
              {mode === "field" && !isFixedField && (
                <p className="play-dice-entry-hint">
                  Wurf einstellen und direkt eintragen.
                </p>
              )}
              {mode === "field" && isFixedField && (
                <p className="play-dice-entry-hint">
                  0 streichen oder Festwert eintragen.
                </p>
              )}
              {mode === "compare" && (
                <p className="play-dice-entry-hint">
                  Wurf setzen — danach passende Felder auf dem Zettel wählen.
                </p>
              )}
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

          {liveScore !== null && (
            <p className="dice-throw-live-score tabular-nums" aria-live="polite">
              → {liveScore} Punkte
            </p>
          )}

          {!isFixedField && (
            <>
              <DiceThrowPreview counts={draftCounts} />
              <DiceCountPicker
                counts={draftCounts}
                disabled={busy}
                onChange={onDraftCountsChange}
              />
            </>
          )}

          {isFixedField && fixedValue !== null && (
            <div className="play-fixed-choice-actions play-fixed-choice-actions--overlay">
              <button
                type="button"
                disabled={busy}
                onClick={() => onFixedScore(0)}
                className={`play-fixed-choice-btn ${
                  fixedScore === 0 ? "play-fixed-choice-btn--selected" : ""
                } disabled:opacity-50`}
              >
                0
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onFixedScore(fixedValue)}
                className={`play-fixed-choice-btn play-fixed-choice-btn--primary ${
                  fixedScore === fixedValue ? "play-fixed-choice-btn--selected" : ""
                } disabled:opacity-50`}
              >
                {fixedValue}
              </button>
            </div>
          )}

          <div className="play-entry-section dice-throw-rolls-section">
            <p className="play-entry-section-label mb-1.5">Würfe für dieses Feld</p>
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

          <div className="play-entry-actions">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onSubmit}
              className="play-entry-btn play-entry-btn--submit disabled:opacity-50"
            >
              {mode === "field" ? "Eintragen" : "Felder vergleichen"}
            </button>
          </div>

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
