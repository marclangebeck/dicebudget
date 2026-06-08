"use client";

import type { AchievementType, AchievementVisual } from "@/lib/achievementTypes";
import { ShareActionBar } from "@/components/ShareActionBar";
import {
  buildAchievementShareText,
  renderAchievementShareImage,
} from "@/lib/achievementShare";

type Props = {
  type: AchievementType;
  visual: AchievementVisual;
  yatzyDieValue?: number | null;
};

export function AchievementShareBar({ type, visual, yatzyDieValue }: Props) {
  return (
    <ShareActionBar
      label="Erfolg teilen"
      shareSuffix="Erfolg"
      filename={`dicebudget-${type}.png`}
      buildText={() => buildAchievementShareText(type, visual)}
      buildImage={() => renderAchievementShareImage({ type, visual, yatzyDieValue })}
    />
  );
}
