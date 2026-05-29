"use client";

import { DiceFace } from "@/components/DiceFace";
import {
  dieCountsTotal,
  type DieCounts,
  type DieValue,
} from "@/lib/scoreFromDice";

const FACES: DieValue[] = [1, 2, 3, 4, 5, 6];
const COUNT_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

type Props = {
  counts: DieCounts;
  disabled?: boolean;
  onChange: (counts: DieCounts) => void;
};

export function DiceCountPicker({ counts, disabled, onChange }: Props) {
  const total = dieCountsTotal(counts);

  function setCount(faceIndex: number, count: number) {
    if (disabled) return;
    const next = [...counts] as DieCounts;
    next[faceIndex] = count;
    onChange(next);
  }

  return (
    <div className="dice-count-picker">
      <p className="dice-count-picker-total tabular-nums" aria-live="polite">
        {total} / 5 Würfel
      </p>
      {FACES.map((face, faceIndex) => (
        <div key={face} className="dice-count-picker-row">
          <DiceFace
            value={face}
            pipClassName="bg-slate-900"
            className="dice-count-picker-face"
          />
          <div
            className="dice-count-picker-options"
            role="radiogroup"
            aria-label={`Anzahl ${face}`}
          >
            {COUNT_OPTIONS.map((count) => {
              const selected = counts[faceIndex] === count;
              return (
                <button
                  key={count}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  aria-label={`${count}× ${face}`}
                  onClick={() => setCount(faceIndex, count)}
                  className={`dice-count-picker-option tabular-nums ${
                    selected ? "is-selected" : ""
                  } disabled:opacity-40`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
