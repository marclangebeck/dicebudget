"use client";

import { useRef, useState } from "react";
import { DiceFace } from "@/components/DiceFace";
import { ExtraYatzyPickerOverlay } from "@/components/ExtraYatzyPickerOverlay";
import { upperBonusDelta } from "@/lib/gameScoring";
import {
  diceValueForField,
  FIELD_LABELS,
  LOWER_FIELD_TYPES,
  SHEET_ROWS,
  SUMMARY_LABELS,
  UPPER_FIELD_TYPES,
} from "@/lib/labels";
import type { SheetRow, SummaryRowKey } from "@/lib/labels";
import type { FieldPreview } from "@/lib/scoreFromDice";
import {
  fieldShouldGoldFlash,
  type SheetFuseHighlight,
} from "@/lib/sheetFuseHighlight";
import type { FieldDto, FieldTypeId, GameDto, RunDto } from "@/lib/types";
import { getAppSettings } from "@/lib/uiPrefs";

type Props = {
  run: RunDto;
  activeFieldId: string | null;
  fieldPreviews?: Map<string, FieldPreview> | null;
  onSelectField: (fieldId: string) => void;
  onIncrementExtraYatzy?: (yatzyDieValue: number) => void;
  extraYatzyBusy?: boolean;
  /** Pool-Endspiel: bereits eingetragene Felder trotz beendetem Run antippbar. */
  allowSelectWhenFinished?: boolean;
  /** Gold-Aufleuchten betroffener Felder (Zeile / Spalte / gesamter Zettel). */
  fuseHighlight?: SheetFuseHighlight | null;
};

function fieldForGame(game: GameDto, fieldType: FieldTypeId): FieldDto | undefined {
  return game.fields.find((f) => f.fieldType === fieldType);
}

/** E1+Bonus als „Ergebnis 1“: Zwischensumme oben, nach 6 Feldern inkl. Bonus (35 ab 63). */
function ergebnis1Value(game: GameDto): number | null {
  const { summary } = game;
  if (summary.ergebnisOben !== null) return summary.ergebnisOben;
  const anyUpperScored = UPPER_FIELD_TYPES.some((ft) => {
    const f = fieldForGame(game, ft);
    return f?.score !== null;
  });
  if (anyUpperScored) return summary.upperSum;
  return null;
}

function summaryValue(game: GameDto, key: SummaryRowKey): string | number | null {
  const { summary } = game;
  switch (key) {
    case "ergebnis1":
      return ergebnis1Value(game);
    case "lowerSum":
      return summary.lowerSum;
    case "gameTotal":
      return summary.gameTotal;
  }
}

function rowLabel(row: SheetRow): string {
  if (row.kind === "field") return FIELD_LABELS[row.fieldType];
  return SUMMARY_LABELS[row.key];
}

function rowSectionClass(row: SheetRow): string {
  if (row.kind === "summary" && (row.key === "ergebnis1" || row.key === "lowerSum")) {
    return "border-t-2 border-slate-400";
  }
  return "";
}

function rowBgClass(row: SheetRow): string {
  if (row.kind === "summary") return "play-row--summary";
  return "";
}

function summaryChipClass(row: Extract<SheetRow, { kind: "summary" }>): string {
  if (row.key === "lowerSum") return "play-summary";
  if (row.key === "ergebnis1") {
    return "play-summary play-summary--highlight play-summary--ergebnis1";
  }
  return "play-summary play-summary--highlight";
}

function YatzyRowLabel({
  extraYatzyCount,
  disabled,
  busy,
  onIncrement,
}: {
  extraYatzyCount: number;
  disabled: boolean;
  busy?: boolean;
  onIncrement?: (yatzyDieValue: number) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<{
    top: number;
    left: number;
    bottom: number;
  } | null>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);

  function openPicker() {
    const rect = plusButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPickerAnchor({
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
    });
    setShowPicker(true);
  }

  return (
    <div className="play-kniffel-label">
      <span className="play-kniffel-label-text">{FIELD_LABELS.KNIFFEL}</span>
      <span className="play-kniffel-label-extras">
        {extraYatzyCount > 0 && (
          <span
            className="play-kniffel-extra-count"
            title={`${extraYatzyCount} Zusatz Alle Fünfe`}
          >
            +{extraYatzyCount}
          </span>
        )}
        <button
          ref={plusButtonRef}
          type="button"
          disabled={disabled || busy}
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
          title="Zusatz Alle Fünfe: +100 Punkte auf Ergebnis Spiel (nächste Spalte)"
          aria-label="Zusatz Alle Fünfe Bonus hinzufügen"
          className="play-kniffel-plus"
        >
          +
        </button>
      </span>
      {showPicker && pickerAnchor && (
        <ExtraYatzyPickerOverlay
          anchor={pickerAnchor}
          disabled={disabled || busy}
          onClose={() => setShowPicker(false)}
          onPick={(value) => {
            setShowPicker(false);
            onIncrement?.(value);
          }}
        />
      )}
    </div>
  );
}

function buildYatzyMarkCounts(run: RunDto): Partial<Record<1 | 2 | 3 | 4 | 5 | 6, number>> {
  const counts: Partial<Record<1 | 2 | 3 | 4 | 5 | 6, number>> = {};
  for (const game of run.games) {
    const kniffel = game.fields.find((f) => f.fieldType === "KNIFFEL");
    const die = kniffel?.yatzyDieValue;
    if (kniffel?.score === 50 && die !== null && die !== undefined && die >= 1 && die <= 6) {
      const key = die as 1 | 2 | 3 | 4 | 5 | 6;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    for (const extraDie of game.summary.extraYatzyDieValues ?? []) {
      if (extraDie >= 1 && extraDie <= 6) {
        const key = extraDie as 1 | 2 | 3 | 4 | 5 | 6;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
  }
  return counts;
}

function FieldRowLabel({
  row,
  extraYatzyCount,
  runActive,
  extraYatzyBusy,
  onIncrementExtraYatzy,
  yatzyMarkCount,
}: {
  row: Extract<SheetRow, { kind: "field" }>;
  extraYatzyCount: number;
  runActive: boolean;
  extraYatzyBusy?: boolean;
  onIncrementExtraYatzy?: (yatzyDieValue: number) => void;
  yatzyMarkCount?: number;
}) {
  if (row.fieldType === "KNIFFEL") {
    return (
      <YatzyRowLabel
        extraYatzyCount={extraYatzyCount}
        disabled={!runActive}
        busy={extraYatzyBusy}
        onIncrement={onIncrementExtraYatzy}
      />
    );
  }
  const diceValue = diceValueForField(row.fieldType);
  if (diceValue !== null) {
    return (
      <span className="play-dice-label inline-flex items-center">
        <DiceFace
          value={diceValue}
          size="field"
          pipClassName="bg-slate-800"
          className="rounded border border-slate-400 bg-white"
        />
        {yatzyMarkCount !== undefined && yatzyMarkCount > 0 && (
          <span
            className="play-yatzy-mark"
            title={`${yatzyMarkCount}× Alle Fünfe mit dieser Augenzahl`}
            aria-label={`${yatzyMarkCount} Alle-Fünfe-Markierungen`}
          >
            {Array.from({ length: yatzyMarkCount }, (_, i) => (
              <DiceFace
                key={i}
                value={diceValue}
                size="mini"
                pipClassName="bg-slate-800"
                className="rounded border border-slate-400 bg-white"
              />
            ))}
          </span>
        )}
      </span>
    );
  }
  return <span className="play-field-label-text">{FIELD_LABELS[row.fieldType]}</span>;
}

function previewClass(tier: FieldPreview["tier"] | undefined): string {
  if (tier === "option") return "play-cell--preview-option";
  if (tier === "zero") return "play-cell--preview-zero";
  return "";
}

function ScoreTile({
  field,
  isActive,
  disabled,
  preview,
  goldFlash,
  onSelect,
}: {
  field: FieldDto;
  isActive: boolean;
  disabled: boolean;
  preview?: FieldPreview;
  goldFlash?: boolean;
  onSelect: () => void;
}) {
  const done = field.score !== null;
  const label = FIELD_LABELS[field.fieldType];
  const previewTitle =
    preview !== undefined
      ? preview.fixedChoice
        ? `${label}: 0 oder ${preview.score} Punkte`
        : `${label}: ${preview.score} Punkte mit diesem Wurf`
      : undefined;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      title={
        done
          ? `${label}: ${field.score} Punkte · ${field.rollsUsed} Würfe – tippen zum Korrigieren`
          : previewTitle ?? `${label} – tippen zum Eintragen`
      }
      className={`play-cell flex h-full min-h-[1.9rem] w-full items-center justify-center tabular-nums md:min-h-[1.6rem] ${
        done
          ? "play-cell--done"
          : isActive
            ? "play-cell--active"
            : previewClass(preview?.tier)
      } ${goldFlash ? "play-cell--gold-flash" : ""}`}
    >
      {done ? field.score : preview !== undefined ? preview.score : null}
    </button>
  );
}

function bonusHint(delta: number): { text: string; cls: string; title: string } {
  if (delta > 0) {
    return {
      text: `+${delta}`,
      cls: "text-emerald-700",
      title: `${delta} über dem Schnitt für den Bonus (Soll: 3 je Augenzahl)`,
    };
  }
  if (delta < 0) {
    return {
      text: `−${Math.abs(delta)}`,
      cls: "text-red-600",
      title: `${Math.abs(delta)} unter dem Schnitt für den Bonus (Soll: 3 je Augenzahl)`,
    };
  }
  return {
    text: "±0",
    cls: "text-slate-500",
    title: "Genau auf Kurs für den Bonus (Soll: 3 je Augenzahl)",
  };
}

function SummaryTile({
  value,
  highlight,
  extraYatzyBonus,
  bonusDelta,
  isErgebnis1,
}: {
  value: string | number | null;
  highlight?: boolean;
  extraYatzyBonus?: number;
  bonusDelta?: number;
  isErgebnis1?: boolean;
}) {
  const display = value === null ? "" : value;
  const hint = bonusDelta !== undefined && value !== null ? bonusHint(bonusDelta) : null;

  return (
    <div
      className={`play-summary flex h-full min-h-[2.2rem] w-full flex-col items-center justify-center px-0.5 tabular-nums md:min-h-[1.9rem] ${
        highlight ? "play-summary--highlight" : ""
      } ${
        isErgebnis1 ? "play-summary--ergebnis1" : ""
      }`}
      title={
        extraYatzyBonus && extraYatzyBonus > 0
          ? `inkl. ${extraYatzyBonus} Zusatz Alle Fünfe`
          : undefined
      }
    >
      <span className="play-summary-value">{display}</span>
      {hint && (
        <span
          className={`play-summary-bonus-delta whitespace-nowrap ${hint.cls}`}
          title={hint.title}
        >
          {hint.text}
        </span>
      )}
      {extraYatzyBonus !== undefined && extraYatzyBonus > 0 && highlight && (
        <span className="text-[8px] font-semibold leading-none text-emerald-800">
          +{extraYatzyBonus}
        </span>
      )}
    </div>
  );
}

export function ScoreSheetTable({
  run,
  activeFieldId,
  fieldPreviews,
  onSelectField,
  onIncrementExtraYatzy,
  extraYatzyBusy,
  allowSelectWhenFinished,
  fuseHighlight = null,
}: Props) {
  const runActive = run.status === "ACTIVE";
  const tilesSelectable = runActive || !!allowSelectWhenFinished;
  const games = run.games;
  const yatzyMarkCounts = buildYatzyMarkCounts(run);
  const gameColCount = games.length;
  const labelColPct = gameColCount <= 2 ? 34 : gameColCount <= 4 ? 30 : 26;
  const gameColPct = (100 - labelColPct) / gameColCount;
  const sheetTheme = getAppSettings().scoreSheetTheme;

  return (
    <div
      className={`play-score-board score-sheet-fixed h-full w-full max-w-full overflow-hidden ${
        sheetTheme === "light" ? "play-score-board--light" : "play-score-board--dark"
      }`}
    >
      <table className="play-score-table h-full w-full table-fixed border-collapse">
        <colgroup>
          <col style={{ width: `${labelColPct}%` }} />
          {games.map((game) => (
            <col key={game.id} style={{ width: `${gameColPct}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="play-table-head-row">
            <th className="play-table-head-label text-left">
              <span className="play-head-chip">Feld</span>
            </th>
            {games.map((game) => (
              <th
                key={game.id}
                className="play-table-head-game text-center"
              >
                <span className="play-head-chip">Sp{game.index}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHEET_ROWS.map((row) => {
            const isSummary = row.kind === "summary";
            const isLowerField =
              row.kind === "field" && LOWER_FIELD_TYPES.includes(row.fieldType);

            return (
              <tr
                key={row.kind === "field" ? row.fieldType : row.key}
                className={`${rowSectionClass(row)} ${rowBgClass(row)}`}
              >
                <th
                  scope="row"
                  title={rowLabel(row)}
                  className={`play-row-label text-left font-normal ${
                    isSummary ? "play-row-label--summary-cell" : ""
                  } ${isLowerField ? "play-row-label--lower" : ""}`}
                >
                  {isSummary ? (
                    <span className={`play-summary-label-chip ${summaryChipClass(row)}`}>
                      {SUMMARY_LABELS[row.key]}
                    </span>
                  ) : (
                    <FieldRowLabel
                      row={row}
                      extraYatzyCount={run.extraYatzyCount}
                      runActive={runActive}
                      extraYatzyBusy={extraYatzyBusy}
                      onIncrementExtraYatzy={onIncrementExtraYatzy}
                      yatzyMarkCount={(() => {
                        const die = diceValueForField(row.fieldType);
                        return die !== null ? yatzyMarkCounts[die] : undefined;
                      })()}
                    />
                  )}
                </th>
                {games.map((game) => (
                  <td key={game.id} className="play-score-cell">
                    {row.kind === "field" ? (
                      (() => {
                        const field = fieldForGame(game, row.fieldType);
                        if (!field) return <div className="h-full min-h-[1.9rem] md:min-h-[1.6rem]" />;
                        return (
                          <ScoreTile
                            field={field}
                            isActive={field.id === activeFieldId}
                            disabled={!tilesSelectable}
                            preview={
                              field.score === null
                                ? fieldPreviews?.get(field.id)
                                : undefined
                            }
                            goldFlash={fieldShouldGoldFlash(
                              fuseHighlight,
                              row.fieldType,
                              game.index,
                            )}
                            onSelect={() => onSelectField(field.id)}
                          />
                        );
                      })()
                    ) : (
                      <SummaryTile
                        value={summaryValue(game, row.key)}
                        highlight={row.highlight}
                        extraYatzyBonus={
                          row.kind === "summary" && row.key === "gameTotal"
                            ? game.summary.extraYatzyBonus
                            : undefined
                        }
                        bonusDelta={
                          row.kind === "summary" && row.key === "ergebnis1"
                            ? upperBonusDelta(game.fields)
                            : undefined
                        }
                        isErgebnis1={row.kind === "summary" && row.key === "ergebnis1"}
                      />
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
