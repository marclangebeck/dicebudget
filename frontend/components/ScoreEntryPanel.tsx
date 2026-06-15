"use client";

import { FieldScoreChoiceGrid } from "@/components/FieldScoreChoiceGrid";
import { YatzyDiePicker } from "@/components/YatzyDiePicker";
import { strategyRollChipOptions } from "@/lib/gameRules";
import { rollSaleAllowedScores, BURN_POOL_COST, canBurnHouseRule } from "@/lib/houseRules";
import { FIELD_LABELS, fieldScoreChoices } from "@/lib/labels";
import type { FieldDto, RunDto } from "@/lib/types";

type Props = {
  id?: string;
  run: RunDto;
  gameIndex: number | null;
  field: FieldDto;
  scoreInput: string;
  rollsUsed: number | null;
  yatzyDieValue?: number | null;
  busy: boolean;
  isCorrection?: boolean;
  canClearLast?: boolean;
  rollsInPoolOverride?: number;
  rollSaleMode?: boolean;
  burnEnabled?: boolean;
  canBurn?: boolean;
  onBurn?: () => void;
  onPickScoreValue: (value: number) => void;
  onYatzyDieValue?: (value: number) => void;
  onRollsUsed: (n: number) => void;
  onSubmit: () => void;
  onClearLast?: () => void;
  onCancel: () => void;
};

export function ScoreEntryPanel({
  id,
  run,
  gameIndex,
  field,
  scoreInput,
  rollsUsed,
  yatzyDieValue,
  busy,
  isCorrection,
  canClearLast,
  rollsInPoolOverride,
  rollSaleMode,
  burnEnabled,
  canBurn,
  onBurn,
  onPickScoreValue,
  onYatzyDieValue,
  onRollsUsed,
  onSubmit,
  onClearLast,
  onCancel,
}: Props) {
  const scoreChoices = rollSaleMode
    ? [...rollSaleAllowedScores(field.fieldType)]
    : fieldScoreChoices(field.fieldType);

  const strategy = run.useStrategyRules && !rollSaleMode;
  const maxExtraRolls = rollsInPoolOverride ?? run.rollsInPool;
  const maxRollsAllowed =
    strategy && run.rollsRemaining != null
      ? run.rollsRemaining + (isCorrection ? field.rollsUsed : 0)
      : undefined;
  const rollOptions = strategy
    ? strategyRollChipOptions(maxExtraRolls, maxRollsAllowed)
    : [1, 2, 3];

  const parsedScore = scoreInput === "" ? null : Number(scoreInput);
  const scoreOk =
    parsedScore !== null &&
    !Number.isNaN(parsedScore) &&
    Number.isInteger(parsedScore) &&
    scoreChoices.includes(parsedScore);

  const needsYatzyDie = field.fieldType === "KNIFFEL" && parsedScore === 50;
  const yatzyDieOk = !needsYatzyDie || (yatzyDieValue !== null && yatzyDieValue !== undefined);

  const canSubmit = rollSaleMode
    ? run.status === "ACTIVE" && scoreOk && !busy
    : run.status === "ACTIVE" &&
      scoreOk &&
      yatzyDieOk &&
      (strategy ? rollsUsed !== null : true) &&
      !busy;

  const entryBlockedHint =
    run.status === "ACTIVE" && !busy && !canSubmit
      ? !scoreOk
        ? rollSaleMode
          ? "Bitte einen erlaubten Verkaufs-Wert wählen."
          : "Bitte einen gültigen Punktwert wählen."
        : needsYatzyDie && !yatzyDieOk
          ? "Bitte den Würfel für Alle Fünfe (50 Punkte) wählen."
          : strategy && rollsUsed === null
            ? "Bitte die Anzahl Würfe für dieses Feld wählen."
            : null
      : null;

  return (
    <div
      id={id}
      className="field-entry-overlay fixed inset-0 z-50 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="field-entry-title"
    >
      <button
        type="button"
        className="field-entry-overlay-backdrop absolute inset-0"
        aria-label="Schließen"
        onClick={onCancel}
      />

      <div className="field-entry-card relative mx-auto w-full max-w-md px-3 sm:px-4">
        <div className="play-entry-panel">
          <div className="play-entry-header">
            <div className="min-w-0">
              <p className="play-entry-kicker">
                {rollSaleMode ? "Verkaufs-Freifeld" : isCorrection ? "Korrektur" : "Eintrag"}
              </p>
              {gameIndex !== null && (
                <p id="field-entry-title" className="play-entry-title">
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

          <div className="play-entry-section">
            <p className="play-entry-section-label mb-1.5">Punkte</p>
            <FieldScoreChoiceGrid
              fieldType={field.fieldType}
              selectedScore={parsedScore}
              disabled={run.status !== "ACTIVE" || busy}
              scoreChoicesOverride={rollSaleMode ? scoreChoices : undefined}
              onPick={onPickScoreValue}
            />
          </div>

          {needsYatzyDie && onYatzyDieValue && (
            <div className="play-entry-section">
              <p className="play-entry-section-label mb-1.5">Alle Fünfe mit Würfel</p>
              <YatzyDiePicker
                disabled={run.status !== "ACTIVE" || busy}
                selected={yatzyDieValue}
                onPick={onYatzyDieValue}
              />
            </div>
          )}

          {rollSaleMode && (
            <p className="play-entry-hint text-[11px]">
              Ohne Würfeln · nur erlaubte Verkaufs-Werte
            </p>
          )}

          {strategy && (
            <div className="play-entry-section">
              <p className="play-entry-section-label mb-1.5">Würfe für dieses Feld</p>
              <div
                className={`play-roll-chips play-roll-chips--large ${
                  rollOptions.length > 6 ? "play-roll-chips--dense" : ""
                }`}
              >
                {rollOptions.map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={run.status !== "ACTIVE" || busy}
                    onClick={() => onRollsUsed(n)}
                    className={`play-roll-chip play-roll-chip--large tabular-nums ${
                      rollsUsed === n ? "play-roll-chip--selected" : ""
                    } disabled:opacity-40`}
                  >
                    <span>{n}</span>
                    {n > 3 ? (
                      <span className="ml-0.5 opacity-90">·P</span>
                    ) : null}
                  </button>
                ))}
              </div>
              <p className="play-entry-hint">
                Anzahl Würfe auf diesem Feld (nicht die Gesamtwurfsnummer) · 1–3 → Pool · ab 4. aus
                Pool
              </p>
            </div>
          )}

          {burnEnabled && onBurn && !rollSaleMode && (
            <div className="play-entry-section play-entry-house-rules">
              <p className="play-entry-section-label mb-1.5">Hausregel</p>
              <button
                type="button"
                disabled={run.status !== "ACTIVE" || busy || !canBurn}
                onClick={onBurn}
                className="play-entry-burn-btn disabled:opacity-45"
              >
                Brennt (−{BURN_POOL_COST} Pool)
              </button>
              {!canBurn && (
                <p className="play-entry-hint mt-1">
                  {run.rollsInPool < BURN_POOL_COST
                    ? `Nicht genug Pool (benötigt ${BURN_POOL_COST}).`
                    : isCorrection
                      ? "Nicht bei Korrekturen."
                      : "Nur bevor der Eintrag gebucht ist."}
                </p>
              )}
              {canBurn && (
                <p className="play-entry-hint mt-1">
                  Physisch neu würfeln, bevor du Punkte einträgst.
                </p>
              )}
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
          {entryBlockedHint && (
            <p className="glass-alert-error mt-2 px-2 py-1.5 text-xs">{entryBlockedHint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
