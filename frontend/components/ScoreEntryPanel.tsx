"use client";

import { FieldScoreChoiceGrid } from "@/components/FieldScoreChoiceGrid";
import { YatzyDiePicker } from "@/components/YatzyDiePicker";
import {
  HouseRulesTableActions,
  isExtraHouseRulesUiAvailable,
} from "@/components/HouseRulesTableActions";
import { strategyRollChipOptions } from "@/lib/gameRules";
import {
  BURN_POOL_COST_REROLL,
  BURN_POOL_COST_SET_FACE,
  rollSaleAllowedScores,
  type BurnMode,
} from "@/lib/houseRules";
import { FIELD_LABELS, fieldScoreChoices } from "@/lib/labels";
import type { FieldDto, RunDto } from "@/lib/types";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import {
  yatzyEfficiencyHitScore,
  yatzyEfficiencyScoreChoices,
} from "@/lib/yatzyEfficiency";

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
  onBurn?: (mode: BurnMode) => void;
  inviteCode?: string;
  lobby?: SessionLobbyDto | null;
  isLocalSolo?: boolean;
  ownPlayerDbId?: string;
  /** Session/Labs: Alle Fünfe Punkte abhängig von Würfen. */
  yatzyEfficiencyEnabled?: boolean;
  onRollSale?: (sellerPlayerId: string, buyerPlayerId: string, pools: number) => void;
  onYatzyStreak?: (victimPlayerId: string) => void;
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
  inviteCode,
  lobby,
  isLocalSolo = false,
  ownPlayerDbId,
  yatzyEfficiencyEnabled = false,
  onRollSale,
  onYatzyStreak,
  onPickScoreValue,
  onYatzyDieValue,
  onRollsUsed,
  onSubmit,
  onClearLast,
  onCancel,
}: Props) {
  const strategy = run.useStrategyRules && !rollSaleMode;
  const efficiencyActive =
    yatzyEfficiencyEnabled &&
    strategy &&
    field.fieldType === "KNIFFEL";

  const scoreChoices = rollSaleMode
    ? [...rollSaleAllowedScores(field.fieldType)]
    : efficiencyActive && rollsUsed != null
      ? [...yatzyEfficiencyScoreChoices(rollsUsed)]
      : fieldScoreChoices(field.fieldType);

  const maxExtraRolls = rollsInPoolOverride ?? run.rollsInPool;
  // Strategy: nur Pool begrenzt die Würfe (Pool 0 → 1–3; sonst 1…3+Pool).
  const rollOptions = strategy
    ? strategyRollChipOptions(maxExtraRolls)
    : [1, 2, 3];

  const parsedScore = scoreInput === "" ? null : Number(scoreInput);
  const scoreOk =
    parsedScore !== null &&
    !Number.isNaN(parsedScore) &&
    Number.isInteger(parsedScore) &&
    scoreChoices.includes(parsedScore);

  const needsYatzyDie = field.fieldType === "KNIFFEL" && parsedScore !== null && parsedScore > 0;
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
          : efficiencyActive && rollsUsed == null
            ? "Bitte zuerst die Würfe wählen (Punkte hängen davon ab)."
            : "Bitte einen gültigen Punktwert wählen."
        : needsYatzyDie && !yatzyDieOk
          ? "Bitte den Würfel für Alle Fünfe wählen."
          : strategy && rollsUsed === null
            ? "Bitte die Anzahl Würfe für dieses Feld wählen."
            : null
      : null;

  function handleRollsUsed(n: number) {
    onRollsUsed(n);
    if (efficiencyActive && parsedScore !== null && parsedScore > 0) {
      onPickScoreValue(yatzyEfficiencyHitScore(n));
    }
  }

  const showExtraRules =
    !rollSaleMode &&
    isExtraHouseRulesUiAvailable(isLocalSolo, run.useStrategyRules) &&
    onRollSale &&
    onYatzyStreak;

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
                    onClick={() => handleRollsUsed(n)}
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
                Anzahl Würfe auf diesem Feld · 1–3 bei leerem Pool · ab 4. aus dem Pool
                {efficiencyActive
                  ? " · Alle Fünfe: bis 7 Würfe = 50, danach −5 je 3 Würfe"
                  : ""}
              </p>
            </div>
          )}

          {burnEnabled && onBurn && !rollSaleMode && (
            <div className="play-entry-section play-entry-house-rules">
              <p className="play-entry-section-label mb-1.5">Brennt</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={
                    run.status !== "ACTIVE" ||
                    busy ||
                    !canBurn ||
                    run.rollsInPool < BURN_POOL_COST_REROLL
                  }
                  onClick={() => onBurn("reroll")}
                  className="play-entry-burn-btn disabled:opacity-45"
                >
                  Neu würfeln (−{BURN_POOL_COST_REROLL} Pool)
                </button>
                <p className="play-entry-hint">
                  Brennenden Würfel nochmal würfeln — die anderen dürfen liegen bleiben.
                </p>
                <button
                  type="button"
                  disabled={
                    run.status !== "ACTIVE" ||
                    busy ||
                    !canBurn ||
                    run.rollsInPool < BURN_POOL_COST_SET_FACE
                  }
                  onClick={() => onBurn("set_face")}
                  className="play-entry-burn-btn disabled:opacity-45"
                >
                  Augenzahl selbst (−{BURN_POOL_COST_SET_FACE} Pool)
                </button>
                <p className="play-entry-hint">
                  Brennenden Würfel daneben legen und die Augenzahl selbst wählen.
                </p>
              </div>
              {!canBurn && (
                <p className="play-entry-hint mt-1">
                  {run.rollsInPool < BURN_POOL_COST_REROLL
                    ? `Nicht genug Pool (mind. ${BURN_POOL_COST_REROLL}).`
                    : isCorrection
                      ? "Nicht bei Korrekturen."
                      : "Nur bevor der Eintrag gebucht ist."}
                </p>
              )}
              {canBurn && run.rollsInPool < BURN_POOL_COST_SET_FACE && (
                <p className="play-entry-hint mt-1">
                  Für „Augenzahl selbst“ brauchst du {BURN_POOL_COST_SET_FACE} Pool
                  (vorhanden {run.rollsInPool}).
                </p>
              )}
            </div>
          )}

          {showExtraRules && (
            <details className="play-entry-extra-rules">
              <summary className="play-entry-extra-rules-summary">Zusatzregeln</summary>
              <HouseRulesTableActions
                run={run}
                inviteCode={inviteCode}
                lobby={lobby ?? null}
                isLocalSolo={isLocalSolo}
                ownPlayerDbId={ownPlayerDbId}
                busy={busy}
                onRollSale={onRollSale}
                onYatzyStreak={onYatzyStreak}
                variant="entry"
              />
            </details>
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
