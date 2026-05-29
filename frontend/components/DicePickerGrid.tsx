"use client";

import { DiceFace } from "@/components/DiceFace";
import type { DiceValues, DieValue } from "@/lib/scoreFromDice";

const FACES: DieValue[] = [1, 2, 3, 4, 5, 6];

type Props = {
  values: DiceValues;
  disabled?: boolean;
  onChange: (values: DiceValues) => void;
};

export function DicePickerGrid({ values, disabled, onChange }: Props) {
  function setDie(index: number, face: DieValue) {
    if (disabled) return;
    const next = [...values] as DiceValues;
    next[index] = face;
    onChange(next);
  }

  return (
    <div className="dice-picker-grid">
      {values.map((value, dieIndex) => (
        <div key={dieIndex} className="dice-picker-grid-row">
          <span className="dice-picker-grid-label tabular-nums">{dieIndex + 1}</span>
          <div
            className="dice-picker-grid-options"
            role="radiogroup"
            aria-label={`Würfel ${dieIndex + 1}`}
          >
            {FACES.map((face) => {
              const selected = value === face;
              return (
                <button
                  key={face}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  aria-label={`Würfel ${dieIndex + 1}: ${face}`}
                  onClick={() => setDie(dieIndex, face)}
                  className={`dice-picker-grid-option ${selected ? "is-selected" : ""} disabled:opacity-40`}
                >
                  <DiceFace
                    value={face}
                    pipClassName="bg-slate-800"
                    className="dice-picker-grid-face"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
