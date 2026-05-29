"use client";

import { FIELD_LABELS, fieldScoreChoices } from "@/lib/labels";
import type { FieldDto, RunDto } from "@/lib/types";

type Props = {
  id?: string;
  run: RunDto;
  gameIndex: number | null;
  field: FieldDto;
  scoreInput: string;
  rollsUsed: number | null;
  busy: boolean;
  isCorrection?: boolean;
  canClearLast?: boolean;
  rollsInPoolOverride?: number;
  onPickScoreValue: (value: number) => void;
  onRollsUsed: (n: number) => void;
  onSubmit: () => void;
  onClearLast?: () => void;
  onCancel: () => void;
  onBackToDice?: () => void;
};

export function ScoreEntryPanel({
  id,
  run,
  gameIndex,
  field,
  scoreInput,
  rollsUsed,
  busy,
  isCorrection,
  canClearLast,
  rollsInPoolOverride,
  onPickScoreValue,
  onRollsUsed,
  onSubmit,
  onClearLast,
  onCancel,
  onBackToDice,
}: Props) {
  const scoreChoices = fieldScoreChoices(field.fieldType);

  const strategy = run.useStrategyRules;
  const maxExtraRolls = rollsInPoolOverride ?? run.rollsInPool;
  const rollOptions = strategy
    ? [1, 2, 3, ...Array.from({ length: maxExtraRolls }, (_, i) => i + 4)]
    : [1, 2, 3];

  const parsedScore = scoreInput === "" ? null : Number(scoreInput);
  const scoreOk =
    parsedScore !== null &&
    !Number.isNaN(parsedScore) &&
    Number.isInteger(parsedScore) &&
    scoreChoices.includes(parsedScore);

  const canSubmit =
    run.status === "ACTIVE" &&
    scoreOk &&
    (strategy ? rollsUsed !== null : true) &&
    !busy;

  const isSumDiceGrid = scoreChoices.length > 15;

  const gridClass = isSumDiceGrid
    ? "grid grid-cols-8 gap-x-0.5 gap-y-1 sm:grid-cols-11 sm:gap-1"
    : scoreChoices.length <= 2
      ? "grid grid-cols-2 gap-2"
      : "grid grid-cols-3 gap-2";

  const btnClass = isSumDiceGrid
    ? "btn-chip min-h-9 w-full px-0 py-1 text-xs font-semibold tabular-nums leading-none sm:min-h-10 sm:text-sm"
    : "btn-chip min-h-14 text-xl font-semibold";

  return (
    <aside
      id={id}
      className="play-entry-sheet pb-safe pointer-events-auto fixed inset-x-0 bottom-0 z-30 px-2"
    >
      <div className="play-entry-panel">
        <div className="play-entry-handle" aria-hidden />
        <div className="play-entry-header">
          <div className="min-w-0">
            <p className="play-entry-kicker">
              {isCorrection ? "Korrektur" : "Eintrag"}
            </p>
            {gameIndex !== null && (
              <p className="play-entry-title">
                Sp{gameIndex} · {FIELD_LABELS[field.fieldType]}
              </p>
            )}
            {canClearLast && (
              <p className="text-muted mt-1 text-[11px] leading-snug">
                Letzter Eintrag – löschen und anderes Feld wählen.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="play-entry-close"
            aria-label="Eintrag schließen"
          >
            ✕
          </button>
        </div>

        <div
          className={`play-entry-score-display tabular-nums ${scoreInput === "" ? "is-empty" : ""}`}
        >
          {scoreInput === "" ? "—" : scoreInput}
        </div>

        <div className="play-entry-section">
          <p
            className={`play-entry-section-label ${isSumDiceGrid ? "mb-1" : "mb-1.5"}`}
          >
            Punkte
          </p>
          <div className={gridClass}>
            {scoreChoices.map((pts) => {
              const sel = scoreInput !== "" && Number(scoreInput) === pts;
              return (
                <button
                  key={pts}
                  type="button"
                  disabled={run.status !== "ACTIVE" || busy}
                  aria-pressed={sel}
                  onClick={() => onPickScoreValue(pts)}
                  className={`${btnClass} play-score-btn disabled:opacity-40 ${sel ? "play-score-btn--selected" : ""}`}
                >
                  {pts}
                </button>
              );
            })}
          </div>
        </div>

        {strategy && (
          <div className="play-entry-section">
            <p className="play-entry-section-label mb-1.5">Würfe für dieses Feld</p>
            <div className="play-roll-chips">
              {rollOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={run.status !== "ACTIVE" || busy}
                  onClick={() => onRollsUsed(n)}
                  className={`play-roll-chip tabular-nums ${
                    rollsUsed === n ? "play-roll-chip--selected" : ""
                  } disabled:opacity-40`}
                >
                  <span>{n}</span>
                  {n > 3 ? (
                    <span className="ml-0.5 hidden opacity-90 sm:inline">·P</span>
                  ) : null}
                </button>
              ))}
            </div>
            <p className="play-entry-hint">1–3 → Pool · ab 4. aus Pool</p>
          </div>
        )}

        <div className={`play-entry-actions ${canClearLast ? "play-entry-actions--split" : ""}`}>
          {canClearLast && onClearLast && (
            <button
              type="button"
              disabled={busy}
              onClick={onClearLast}
              className="play-entry-btn play-entry-btn--clear disabled:opacity-50"
            >
              Eintrag löschen
            </button>
          )}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="play-entry-btn play-entry-btn--submit disabled:opacity-50"
          >
            {isCorrection ? "Korrigieren" : "Eintragen"}
          </button>
        </div>

        {onBackToDice && !isCorrection && (
          <button
            type="button"
            disabled={busy}
            onClick={onBackToDice}
            className="play-dice-entry-manual-link mt-2 w-full disabled:opacity-50"
          >
            Mit Würfeln eintragen
          </button>
        )}
      </div>
    </aside>
  );
}
