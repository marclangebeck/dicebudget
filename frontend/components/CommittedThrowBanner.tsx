"use client";

import { DiceFace } from "@/components/DiceFace";
import type { DiceValues } from "@/lib/scoreFromDice";

type Props = {
  dice: DiceValues;
  rollsUsed: number;
  busy?: boolean;
  onEdit: () => void;
  onCancel: () => void;
};

export function CommittedThrowBanner({
  dice,
  rollsUsed,
  busy,
  onEdit,
  onCancel,
}: Props) {
  return (
    <div className="play-throw-banner shrink-0">
      <div className="play-throw-banner-main">
        <div className="play-throw-banner-dice" aria-label="Dein Wurf">
          {dice.map((value, index) => (
            <DiceFace
              key={index}
              value={value}
              pipClassName="bg-slate-800"
              className="play-throw-banner-die"
            />
          ))}
        </div>
        <p className="play-throw-banner-text">
          <span className="tabular-nums">{rollsUsed}</span>{" "}
          {rollsUsed === 1 ? "Wurf" : "Würfe"} — tippe ein Feld auf dem Zettel.
        </p>
      </div>
      <div className="play-throw-banner-actions">
        <button
          type="button"
          disabled={busy}
          onClick={onEdit}
          className="play-throw-banner-btn disabled:opacity-50"
        >
          Wurf ändern
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="play-throw-banner-btn play-throw-banner-btn--muted disabled:opacity-50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
