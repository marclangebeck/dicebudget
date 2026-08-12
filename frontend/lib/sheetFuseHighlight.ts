import { listFullFieldTypeRows } from "@/lib/houseRules";
import { LOWER_FIELD_TYPES, UPPER_FIELD_TYPES } from "@/lib/labels";
import type { FieldTypeId } from "@/lib/types";

/** Dauer für 3× goldenes Aufleuchten (~1,4 s). */
export const SHEET_GOLD_FLASH_MS = 1400;

/** @deprecated Alias — gleiche Dauer. */
export const FUSE_HIGHLIGHT_MS = SHEET_GOLD_FLASH_MS;

const ALL_FIELD_TYPES: FieldTypeId[] = [...UPPER_FIELD_TYPES, ...LOWER_FIELD_TYPES];

type ScoredFieldRow = {
  fieldType: FieldTypeId;
  score: number | null;
};

type GameRow = {
  index?: number;
  fields: ScoredFieldRow[];
};

export type SheetFuseHighlight = {
  rows: FieldTypeId[];
  /** `game.index` (1-basiert wie auf dem Zettel). */
  columns: number[];
};

export function isGameColumnComplete(game: GameRow): boolean {
  for (const fieldType of ALL_FIELD_TYPES) {
    const field = game.fields.find((f) => f.fieldType === fieldType);
    if (!field || field.score === null) return false;
  }
  return true;
}

export function detectNewlyCompletedFieldRows(
  gamesBefore: GameRow[],
  gamesAfter: GameRow[],
): FieldTypeId[] {
  const beforeFull = new Set(listFullFieldTypeRows(gamesBefore));
  return listFullFieldTypeRows(gamesAfter).filter((ft) => !beforeFull.has(ft));
}

export function detectNewlyCompletedGameColumns(
  gamesBefore: GameRow[],
  gamesAfter: GameRow[],
): number[] {
  const newly: number[] = [];
  for (const after of gamesAfter) {
    const index = after.index;
    if (index == null) continue;
    if (!isGameColumnComplete(after)) continue;
    const before =
      gamesBefore.find((g) => g.index === index) ??
      gamesBefore[gamesAfter.indexOf(after)];
    if (before && isGameColumnComplete(before)) continue;
    newly.push(index);
  }
  return newly;
}

export function detectSheetFuseHighlight(
  gamesBefore: GameRow[],
  gamesAfter: GameRow[],
): SheetFuseHighlight | null {
  const rows = detectNewlyCompletedFieldRows(gamesBefore, gamesAfter);
  const columns = detectNewlyCompletedGameColumns(gamesBefore, gamesAfter);
  if (rows.length === 0 && columns.length === 0) return null;
  return { rows, columns };
}

export function fieldShouldGoldFlash(
  highlight: SheetFuseHighlight | null | undefined,
  fieldType: FieldTypeId,
  gameIndex: number,
): boolean {
  if (!highlight) return false;
  if (highlight.rows.includes(fieldType)) return true;
  if (highlight.columns.includes(gameIndex)) return true;
  return false;
}
