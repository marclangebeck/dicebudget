"use client";

import { AchievementOverlay } from "@/components/AchievementOverlay";

type Props = {
  /** Spielblock (1-basiert), in dem der Bonus erreicht wurde. */
  gameIndex?: number | null;
  onClose: () => void;
};

/** @deprecated Nutze AchievementOverlay mit type="bonus". */
export function BonusOverlay({ gameIndex, onClose }: Props) {
  return (
    <AchievementOverlay type="bonus" gameIndex={gameIndex} onClose={onClose} />
  );
}
