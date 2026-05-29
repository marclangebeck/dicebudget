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

  function setCount(faceIndex: number, target: number) {
    if (disabled) return;
    if (target < 0 || target > 5) return;
    const current = counts[faceIndex];
    const others = total - current;
    if (others + target > 5) return;

    const next = [...counts] as DieCounts;
    next[faceIndex] = target;
    onChange(next);
  }

  function bump(faceIndex: number) {
    if (disabled) return;
    setCount(faceIndex, counts[faceIndex] + 1);
  }

  return (
    <div className="dice-count-picker">
      <p className="dice-count-picker-hint">
        Zahl antippen setzt die Anzahl sofort — Würfel tippt +1 dazu.
      </p>
      <div className="dice-count-grid">
        {FACES.map((face, faceIndex) => {
          const count = counts[faceIndex];
          const canBump = total < 5 && count < 5;

          return (
            <div key={face} className="dice-count-card">
              <button
                type="button"
                disabled={disabled || !canBump}
                aria-label={`${face} hinzufügen`}
                onClick={() => bump(faceIndex)}
                className="dice-count-card-face-btn disabled:opacity-40"
              >
                <DiceFace
                  value={face}
                  pipClassName="bg-slate-900"
                  className="dice-count-card-face"
                />
              </button>
              <div className="dice-count-chip-grid" role="group" aria-label={`Anzahl ${face}`}>
                {COUNT_OPTIONS.map((option) => {
                  const others = total - count;
                  const allowed = others + option <= 5;
                  const selected = count === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={disabled || !allowed}
                      aria-label={`${option}× ${face}`}
                      aria-pressed={selected}
                      onClick={() => setCount(faceIndex, option)}
                      className={`dice-count-chip tabular-nums ${
                        selected ? "dice-count-chip--selected" : ""
                      } disabled:opacity-30`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
