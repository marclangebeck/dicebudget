"use client";

import { FieldScoreChoiceGrid } from "@/components/FieldScoreChoiceGrid";
import { FIELD_LABELS, fieldScoreChoices } from "@/lib/labels";
import type { FieldDto } from "@/lib/types";

type Props = {
  field: FieldDto;
  gameIndex: number | null;
  scoreInput: string;
  busy: boolean;
  onPickScoreValue: (value: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

/** Pool-Endspiel: Sieger wählt einen neuen Wert für ein bereits eingetragenes Feld (M33). */
export function PoolEndgamePanel({
  field,
  gameIndex,
  scoreInput,
  busy,
  onPickScoreValue,
  onSubmit,
  onCancel,
}: Props) {
  const scoreChoices = fieldScoreChoices(field.fieldType);
  const parsedScore = scoreInput === "" ? null : Number(scoreInput);
  const scoreOk =
    parsedScore !== null &&
    !Number.isNaN(parsedScore) &&
    Number.isInteger(parsedScore) &&
    scoreChoices.includes(parsedScore);
  const canSubmit = scoreOk && !busy;

  return (
    <div
      className="field-entry-overlay fixed inset-0 z-50 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pool-endgame-title"
    >
      <button
        type="button"
        className="field-entry-overlay-backdrop absolute inset-0"
        aria-label="Schließen"
        onClick={onCancel}
      />

      <div className="field-entry-card relative mx-auto w-full max-w-md px-3 sm:px-4">
        <div className="play-entry-panel">
          <div className="play-entry-header">
            <div className="min-w-0">
              <p className="play-entry-kicker">Pool-Endspiel</p>
              {gameIndex !== null && (
                <p id="pool-endgame-title" className="play-entry-title">
                  Sp{gameIndex} · {FIELD_LABELS[field.fieldType]}
                </p>
              )}
              <p className="text-muted mt-1 text-[11px] leading-snug">
                Bisher: <span className="tabular-nums">{field.score}</span> · neuen Wert wählen
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="play-entry-close"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          <div className="play-entry-section">
            <p className="play-entry-section-label mb-1.5">Neuer Wert</p>
            <FieldScoreChoiceGrid
              fieldType={field.fieldType}
              selectedScore={parsedScore}
              disabled={busy}
              onPick={onPickScoreValue}
            />
          </div>

          <div className="play-entry-actions">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onSubmit}
              className="play-entry-btn play-entry-btn--submit disabled:opacity-50"
            >
              Übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
