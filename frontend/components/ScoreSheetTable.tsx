"use client";

import { DiceFace } from "@/components/DiceFace";
import { upperBonusDelta } from "@/lib/gameScoring";
import {
  diceValueForField,
  FIELD_LABELS,
  SHEET_ROWS,
  SUMMARY_LABELS,
  UPPER_FIELD_TYPES,
} from "@/lib/labels";
import type { SheetRow, SummaryRowKey } from "@/lib/labels";
import type { FieldPreview } from "@/lib/scoreFromDice";
import type { FieldDto, FieldTypeId, GameDto, RunDto } from "@/lib/types";

type Props = {
  run: RunDto;
  activeFieldId: string | null;
  fieldPreviews?: Map<string, FieldPreview> | null;
  onSelectField: (fieldId: string) => void;
  onIncrementExtraYatzy?: () => void;
  extraYatzyBusy?: boolean;
  /** Pool-Endspiel: bereits eingetragene Felder trotz beendetem Run antippbar. */
  allowSelectWhenFinished?: boolean;
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

function YatzyRowLabel({
  extraYatzyCount,
  disabled,
  busy,
  onIncrement,
}: {
  extraYatzyCount: number;
  disabled: boolean;
  busy?: boolean;
  onIncrement?: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[10px] leading-tight md:text-[11px]">{FIELD_LABELS.KNIFFEL}</span>
      {extraYatzyCount > 0 && (
        <span
          className="rounded bg-emerald-100 px-1 py-px text-[9px] font-bold leading-none text-emerald-900"
          title={`${extraYatzyCount} Zusatz-Yatzy`}
        >
          +{extraYatzyCount}
        </span>
      )}
      <button
        type="button"
        disabled={disabled || busy}
        onClick={(e) => {
          e.stopPropagation();
          onIncrement?.();
        }}
        title="Zusatz-Yatzy: +100 Punkte auf Ergebnis Spiel (nächste Spalte)"
        aria-label="Zusatz-Yatzy Bonus hinzufügen"
        className="flex h-5 min-w-5 items-center justify-center rounded border border-emerald-700 bg-emerald-600 px-0.5 text-[11px] font-bold leading-none text-white disabled:opacity-40"
      >
        +
      </button>
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
  onIncrementExtraYatzy?: () => void;
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
          pipClassName="bg-slate-800"
          className="h-5 w-5 rounded border border-slate-400 bg-white md:h-5 md:w-5"
        />
        {yatzyMarkCount !== undefined && yatzyMarkCount > 0 && (
          <span
            className="play-yatzy-mark"
            title={`${yatzyMarkCount}× Yatzy mit dieser Augenzahl`}
            aria-label={`${yatzyMarkCount} Yatzy-Markierungen`}
          >
            {Array.from({ length: yatzyMarkCount }, (_, i) => (
              <DiceFace
                key={i}
                value={diceValue}
                pipClassName="bg-slate-800"
                className="play-yatzy-mark-dice h-2.5 w-2.5 rounded border border-slate-400 bg-white"
              />
            ))}
          </span>
        )}
      </span>
    );
  }
  return <span className="text-[10px] leading-tight md:text-[11px]">{FIELD_LABELS[row.fieldType]}</span>;
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
  onSelect,
}: {
  field: FieldDto;
  isActive: boolean;
  disabled: boolean;
  preview?: FieldPreview;
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
      className={`play-cell flex h-full min-h-[1.9rem] w-full items-center justify-center text-[11px] font-semibold tabular-nums md:min-h-[1.6rem] md:text-[10px] ${
        done
          ? "play-cell--done"
          : isActive
            ? "play-cell--active"
            : previewClass(preview?.tier)
      }`}
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
      className={`play-summary flex h-full min-h-[2.2rem] w-full flex-col items-center justify-center px-0.5 text-[11px] tabular-nums md:min-h-[1.9rem] md:text-[10px] ${
        highlight ? "play-summary--highlight" : ""
      } ${
        isErgebnis1 ? "play-summary--ergebnis1" : ""
      }`}
      title={
        extraYatzyBonus && extraYatzyBonus > 0
          ? `inkl. ${extraYatzyBonus} Zusatz-Yatzy`
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
}: Props) {
  const runActive = run.status === "ACTIVE";
  const tilesSelectable = runActive || !!allowSelectWhenFinished;
  const games = run.games;
  const yatzyMarkCounts = buildYatzyMarkCounts(run);
  const gameColCount = games.length;
  const labelColPct = gameColCount <= 2 ? 30 : gameColCount <= 4 ? 26 : 22;
  const gameColPct = (100 - labelColPct) / gameColCount;

  return (
    <div className="play-score-board score-sheet-fixed h-full w-full max-w-full overflow-hidden">
      <table className="play-score-table h-full w-full table-fixed border-collapse text-[11px] md:text-[10px]">
        <colgroup>
          <col style={{ width: `${labelColPct}%` }} />
          {games.map((game) => (
            <col key={game.id} style={{ width: `${gameColPct}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="play-table-head-row">
            <th className="play-table-head-label px-1 py-1 text-left text-[10px] font-semibold">
              Feld
            </th>
            {games.map((game) => (
              <th
                key={game.id}
                className="play-table-head-game px-0 py-1 text-center text-[10px] font-bold"
              >
                Sp{game.index}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHEET_ROWS.map((row) => {
            const isSummary = row.kind === "summary";

            return (
              <tr
                key={row.kind === "field" ? row.fieldType : row.key}
                className={`${rowSectionClass(row)} ${rowBgClass(row)}`}
              >
                <th
                  scope="row"
                  title={rowLabel(row)}
                  className={`play-row-label px-1 py-0.5 text-left font-normal ${
                    row.kind === "summary" && row.highlight
                      ? "play-row-label--highlight"
                      : isSummary
                        ? "play-row-label--summary"
                        : ""
                  }`}
                >
                  {isSummary ? (
                    SUMMARY_LABELS[row.key]
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
                  <td key={game.id} className="px-0.5 py-px">
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
