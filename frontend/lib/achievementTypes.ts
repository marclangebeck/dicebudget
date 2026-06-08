import { UPPER_BONUS_MIN, UPPER_BONUS_POINTS } from "@/lib/gameScoring";

export type AchievementType = "bonus" | "lower_complete" | "large_straight" | "yatzy";

export const ACHIEVEMENT_PRIORITY: AchievementType[] = [
  "yatzy",
  "large_straight",
  "lower_complete",
  "bonus",
];

export const ACHIEVEMENT_DURATION_MS: Record<AchievementType, number> = {
  bonus: 2800,
  lower_complete: 3000,
  large_straight: 3200,
  yatzy: 4000,
};

export const ACHIEVEMENT_CONFETTI_COUNT: Record<AchievementType, number> = {
  bonus: 36,
  lower_complete: 42,
  large_straight: 48,
  yatzy: 64,
};

export type AchievementVisual = {
  kicker: string;
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
        kicker: "Bonus freigeschaltet",
        badge: `+${UPPER_BONUS_POINTS}`,
        title: "Obere Sektion gesichert!",
        subtitle: `≥ ${UPPER_BONUS_MIN} Punkte${gameSuffix} — Belohnung gutgeschrieben`,
        confettiColors: ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#e5c07b"],
      };
    case "lower_complete":
      return {
        kicker: "Sektion komplett",
        badge: "7/7",
        title: "Untere Spalte voll!",
        subtitle: `Alle Kombinationsfelder${gameSuffix} abgeschlossen`,
        confettiColors: ["#22d3ee", "#38bdf8", "#67e8f9", "#7dd3fc", "#e5c07b"],
      };
    case "large_straight":
      return {
        kicker: "Combo-Kette",
        badge: "+40",
        title: "Große Straße!",
        subtitle: `2·3·4·5·6${gameSuffix} — volle Punktzahl`,
        confettiColors: ["#fbbf24", "#f59e0b", "#fcd34d", "#e5c07b", "#fde68a"],
      };
    case "yatzy":
      return {
        kicker: "Jackpot",
        badge: "+50",
        title: "ALLE FÜNFE!",
        subtitle: `Fünf gleiche${gameSuffix} — legendärer Treffer`,
        confettiColors: ["#fef08a", "#facc15", "#fde047", "#f472b6", "#ffffff", "#e5c07b"],
      };
  }
}
