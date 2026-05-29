"use client";

import { DiceFace } from "@/components/DiceFace";
import {
  diceValueForField,
  fieldScoreChoices,
  upperFieldDieCount,
} from "@/lib/labels";
import type { FieldTypeId } from "@/lib/types";

type Props = {
  fieldType: FieldTypeId;
  selectedScore: number | null;
  disabled?: boolean;
  onPick: (score: number) => void;
};

export function FieldScoreChoiceGrid({
  fieldType,
  selectedScore,
  disabled,
  onPick,
}: Props) {
  const choices = fieldScoreChoices(fieldType);
  const face = diceValueForField(fieldType);
  const isSumDiceGrid = choices.length > 15;

  if (face !== null) {
    return (
      <div className="upper-field-score-grid">
        {choices.map((pts) => {
          const count = upperFieldDieCount(fieldType, pts);
          const selected = selectedScore === pts;

          return (
            <button
              key={pts}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={
                count === 0
                  ? "0 Punkte — streichen"
                  : `${count}× ${face} — ${pts} Punkte`
              }
              onClick={() => onPick(pts)}
              className={`upper-field-score-btn disabled:opacity-40 ${
                selected ? "upper-field-score-btn--selected" : ""
              }`}
            >
              <div className="upper-field-dice-row">
                {count === 0 ? (
                  <span className="upper-field-empty" aria-hidden>
                    —
                  </span>
                ) : (
                  Array.from({ length: count }, (_, index) => (
                    <DiceFace
                      key={index}
                      value={face}
                      pipClassName="bg-slate-900"
                      className={`upper-field-dice ${count >= 4 ? "upper-field-dice--sm" : ""}`}
                    />
                  ))
                )}
              </div>
              <span className="upper-field-pts tabular-nums">{pts}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const gridClass = isSumDiceGrid
    ? "field-score-sum-grid"
    : choices.length <= 2
      ? "field-score-fixed-grid"
      : "field-score-default-grid";

  const btnClass = isSumDiceGrid
    ? "field-score-sum-btn tabular-nums"
    : "field-score-fixed-btn tabular-nums";

  return (
    <div className={gridClass}>
      {choices.map((pts) => {
        const selected = selectedScore === pts;
        return (
          <button
            key={pts}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onPick(pts)}
            className={`${btnClass} play-score-btn disabled:opacity-40 ${
              selected ? "play-score-btn--selected" : ""
            }`}
          >
            {pts}
          </button>
        );
      })}
    </div>
  );
}
