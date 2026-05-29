"use client";

import { DiceFace } from "@/components/DiceFace";
import {
  dieCountsTotal,
  type DieCounts,
  type DieValue,
} from "@/lib/scoreFromDice";

const FACES: DieValue[] = [1, 2, 3, 4, 5, 6];

type Props = {
  counts: DieCounts;
  disabled?: boolean;
  onChange: (counts: DieCounts) => void;
};

export function DiceCountPicker({ counts, disabled, onChange }: Props) {
  const total = dieCountsTotal(counts);

  function adjust(faceIndex: number, delta: number) {
    if (disabled) return;
    const current = counts[faceIndex];
    const nextCount = current + delta;
    if (nextCount < 0 || nextCount > 5) return;
    if (delta > 0 && total >= 5) return;

    const next = [...counts] as DieCounts;
    next[faceIndex] = nextCount;
    onChange(next);
  }

  return (
    <div className="dice-count-picker">
      <p className="dice-count-picker-hint">
        Pro Augenzahl die Anzahl wählen — mit +/− oder direkt antippen.
      </p>
      <div className="dice-count-grid">
        {FACES.map((face, faceIndex) => {
          const count = counts[faceIndex];
          const canIncrease = total < 5 && count < 5;
          const canDecrease = count > 0;

          return (
            <div key={face} className="dice-count-card">
              <DiceFace
                value={face}
                pipClassName="bg-slate-900"
                className="dice-count-card-face"
              />
              <div className="dice-count-card-controls">
                <button
                  type="button"
                  disabled={disabled || !canDecrease}
                  aria-label={`${face} minus`}
                  onClick={() => adjust(faceIndex, -1)}
                  className="dice-count-card-step disabled:opacity-40"
                >
                  −
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`${count}× ${face}`}
                  onClick={() => {
                    if (disabled) return;
                    const next = count >= 5 ? 0 : count + 1;
                    if (next > count && total >= 5) return;
                    const updated = [...counts] as DieCounts;
                    updated[faceIndex] = next;
                    onChange(updated);
                  }}
                  className={`dice-count-card-value tabular-nums ${
                    count > 0 ? "has-value" : ""
                  }`}
                >
                  {count}
                </button>
                <button
                  type="button"
                  disabled={disabled || !canIncrease}
                  aria-label={`${face} plus`}
                  onClick={() => adjust(faceIndex, 1)}
                  className="dice-count-card-step disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
