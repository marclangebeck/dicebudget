import { UPPER_BONUS_MIN, UPPER_BONUS_POINTS } from "@/lib/gameScoring";

export type AchievementType = "bonus" | "lower_complete" | "large_straight" | "yatzy";

export const ACHIEVEMENT_PRIORITY: AchievementType[] = [
  "yatzy",
  "large_straight",
  "lower_complete",
  "bonus",
];

export const ACHIEVEMENT_DURATION_MS: Record<AchievementType, number> = {
  bonus: 2500,
  lower_complete: 2800,
  large_straight: 3000,
  yatzy: 3500,
};

export const ACHIEVEMENT_CONFETTI_COUNT: Record<AchievementType, number> = {
  bonus: 36,
  lower_complete: 42,
  large_straight: 48,
  yatzy: 64,
};

export type AchievementVisual = {
  title: string;
  subtitle: string;
  badge?: string;
  confettiColors: string[];
};

export function achievementVisual(
  type: AchievementType,
  gameIndex?: number | null,
): AchievementVisual {
  const gameSuffix = gameIndex ? ` (Spiel ${gameIndex})` : "";

  switch (type) {
    case "bonus":
      return {
        badge: `+${UPPER_BONUS_POINTS}`,
        title: "Bonus erreicht!",
        subtitle: `Obere Reihe${gameSuffix} ≥ ${UPPER_BONUS_MIN} – plus ${UPPER_BONUS_POINTS} Punkte`,
        confettiColors: ["#10b981", "#34d399", "#a7f3d0", "#fbbf24", "#38bdf8"],
      };
    case "lower_complete":
      return {
        badge: "7/7",
        title: "Untere Spalte voll!",
        subtitle: `Alle Kombinationsfelder${gameSuffix} eingetragen`,
        confettiColors: ["#22d3ee", "#06b6d4", "#67e8f9", "#a5f3fc", "#38bdf8"],
      };
    case "large_straight":
      return {
        badge: "+40",
        title: "Große Straße!",
        subtitle: `2-3-4-5-6${gameSuffix} – volle Punktzahl`,
        confettiColors: ["#fbbf24", "#f59e0b", "#fcd34d", "#fde68a", "#d97706"],
      };
    case "yatzy":
      return {
        badge: "+50",
        title: "Yatzy!",
        subtitle: `Fünf gleiche${gameSuffix} – Jackpot`,
        confettiColors: ["#fef08a", "#facc15", "#fde047", "#f472b6", "#ffffff", "#fbbf24"],
      };
  }
}
