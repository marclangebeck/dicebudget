import { ACHIEVEMENT_DURATION_MS, type AchievementType } from "@/lib/achievementTypes";
import { detectAchievementAfterField } from "@/lib/gameAchievements";
import { playAchievementSound } from "@/lib/achievementSound";
import { getAchievementAnimationsEnabled } from "@/lib/gameFeedbackPrefs";
import type { FieldTypeId } from "@/lib/types";

export type AchievementOverlayState = {
  type: AchievementType;
  gameIndex: number | null;
  yatzyDieValue?: number | null;
};

export function achievementDurationMs(type: AchievementType): number {
  return ACHIEVEMENT_DURATION_MS[type];
}

export function buildAchievementAfterField(
  fieldType: FieldTypeId,
  score: number,
  fieldsBefore: { fieldType: string; score: number | null }[],
  fieldsAfter: { fieldType: string; score: number | null }[],
  gameIndex: number | null,
  yatzyDieValue?: number | null,
): AchievementOverlayState | null {
  if (!getAchievementAnimationsEnabled()) return null;

  const type = detectAchievementAfterField(fieldType, score, fieldsBefore, fieldsAfter);
  if (!type) return null;

  return {
    type,
    gameIndex,
    yatzyDieValue: type === "yatzy" ? yatzyDieValue ?? null : undefined,
  };
}

export function notifyAchievement(state: AchievementOverlayState): void {
  playAchievementSound(state.type);
}
