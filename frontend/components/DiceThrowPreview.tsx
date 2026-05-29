"use client";

import { DiceFace } from "@/components/DiceFace";
import {
  dieCountsToPartialDice,
  dieCountsTotal,
  type DieCounts,
} from "@/lib/scoreFromDice";

type Props = {
  counts: DieCounts;
  compact?: boolean;
};

export function DiceThrowPreview({ counts, compact }: Props) {
  const total = dieCountsTotal(counts);
  const dice = dieCountsToPartialDice(counts);
  const emptySlots = Math.max(0, 5 - total);

  return (
    <div className={`dice-throw-preview ${compact ? "dice-throw-preview--compact" : ""}`}>
      <div className="dice-throw-preview-head">
        <p className="dice-throw-preview-label">Dein Wurf</p>
        <p
          className={`dice-throw-preview-total tabular-nums ${
            total === 5 ? "is-complete" : ""
          }`}
          aria-live="polite"
        >
          {total} / 5
        </p>
      </div>
      <div className="dice-throw-preview-dice" aria-label={`${total} von 5 Würfeln gesetzt`}>
        {dice.map((value, index) => (
          <DiceFace
            key={`d-${index}`}
            value={value}
            pipClassName="bg-slate-900"
            className="dice-throw-preview-die"
          />
        ))}
        {Array.from({ length: emptySlots }, (_, index) => (
          <div key={`e-${index}`} className="dice-throw-preview-empty" aria-hidden>
            ?
          </div>
        ))}
      </div>
    </div>
  );
}
