"use client";

import { fieldScoreChoices } from "@/lib/labels";
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
  const isSumDiceGrid = choices.length > 15;

  const gridClass = isSumDiceGrid
    ? "field-score-sum-grid"
    : choices.length <= 2
      ? "field-score-fixed-grid"
      : "field-score-default-grid";

  const btnClass = isSumDiceGrid
    ? "field-score-sum-btn tabular-nums"
    : choices.length <= 2
      ? "field-score-fixed-btn tabular-nums"
      : "field-score-upper-btn tabular-nums";

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
