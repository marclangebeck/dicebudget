import {
  ACHIEVEMENT_PRIORITY,
  type AchievementType,
} from "@/lib/achievementTypes";
import { LOWER_FIELD_TYPES, upperBonusAchieved } from "@/lib/gameScoring";
import type { FieldTypeId } from "@/lib/types";

type ScoredField = {
  fieldType: string;
  score: number | null;
};

export function lowerSectionComplete(fields: ScoredField[]): boolean {
  const lowerFields = fields.filter((f) =>
    LOWER_FIELD_TYPES.includes(f.fieldType as FieldTypeId),
  );
  return (
    lowerFields.length === LOWER_FIELD_TYPES.length &&
    lowerFields.every((f) => f.score !== null)
  );
}

export function detectAchievements(
  fieldType: FieldTypeId,
  score: number,
  fieldsBefore: ScoredField[],
  fieldsAfter: ScoredField[],
): AchievementType[] {
  const achieved: AchievementType[] = [];

  if (fieldType === "KNIFFEL" && score > 0) {
    achieved.push("yatzy");
  }
  if (fieldType === "LARGE_STRAIGHT" && score >= 40) {
    achieved.push("large_straight");
  }
  if (!lowerSectionComplete(fieldsBefore) && lowerSectionComplete(fieldsAfter)) {
    achieved.push("lower_complete");
  }
  if (!upperBonusAchieved(fieldsBefore) && upperBonusAchieved(fieldsAfter)) {
    achieved.push("bonus");
  }

  return achieved;
}

export function pickHighestAchievement(types: AchievementType[]): AchievementType | null {
  for (const type of ACHIEVEMENT_PRIORITY) {
    if (types.includes(type)) return type;
  }
  return null;
}

export function detectAchievementAfterField(
  fieldType: FieldTypeId,
  score: number,
  fieldsBefore: ScoredField[],
  fieldsAfter: ScoredField[],
): AchievementType | null {
  return pickHighestAchievement(
    detectAchievements(fieldType, score, fieldsBefore, fieldsAfter),
  );
}
