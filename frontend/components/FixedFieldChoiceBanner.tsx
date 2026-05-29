"use client";

import { FIELD_LABELS } from "@/lib/labels";
import { fixedRuleScore } from "@/lib/scoreFromDice";
import type { FieldTypeId } from "@/lib/types";

type Props = {
  fieldType: FieldTypeId;
  busy?: boolean;
  onPick: (score: number) => void;
  onCancel: () => void;
};

export function FixedFieldChoiceBanner({ fieldType, busy, onPick, onCancel }: Props) {
  const fixed = fixedRuleScore(fieldType);
  if (fixed === null) return null;

  return (
    <div className="play-fixed-choice-banner shrink-0">
      <p className="play-fixed-choice-label">
        {FIELD_LABELS[fieldType]} — 0 oder {fixed}?
      </p>
      <div className="play-fixed-choice-actions">
        <button
          type="button"
          disabled={busy}
          onClick={() => onPick(0)}
          className="play-fixed-choice-btn disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onPick(fixed)}
          className="play-fixed-choice-btn play-fixed-choice-btn--primary disabled:opacity-50"
        >
          {fixed}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="play-fixed-choice-btn play-fixed-choice-btn--muted disabled:opacity-50"
          aria-label="Abbrechen"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
