"use client";

import { useMemo } from "react";
import { DiceFace } from "@/components/DiceFace";
import {
  ACHIEVEMENT_CONFETTI_COUNT,
  achievementVisual,
  type AchievementType,
} from "@/lib/achievementTypes";

type Props = {
  type: AchievementType;
  gameIndex?: number | null;
  yatzyDieValue?: number | null;
  onClose: () => void;
};

const STRAIGHT_DICE = [2, 3, 4, 5, 6] as const;

export function AchievementOverlay({ type, gameIndex, yatzyDieValue, onClose }: Props) {
  const visual = achievementVisual(type, gameIndex);
  const confettiCount = ACHIEVEMENT_CONFETTI_COUNT[type];

  const confetti = useMemo(
    () =>
      Array.from({ length: confettiCount }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 0.9,
        color: visual.confettiColors[i % visual.confettiColors.length],
        rotate: Math.round(Math.random() * 360),
        drift: Math.round((Math.random() - 0.5) * 90),
        width: 6 + Math.random() * 6,
      })),
    [confettiCount, visual.confettiColors],
  );

  const yatzyFace =
    yatzyDieValue !== null &&
    yatzyDieValue !== undefined &&
    yatzyDieValue >= 1 &&
    yatzyDieValue <= 6
      ? (yatzyDieValue as 1 | 2 | 3 | 4 | 5 | 6)
      : 5;

  return (
    <div
      className={`achievement-overlay achievement-overlay--${type} fixed inset-0 z-50 flex items-center justify-center p-4`}
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <div className="achievement-confetti" aria-hidden>
        {confetti.map((c, i) => (
          <span
            key={i}
            className="achievement-confetti-piece"
            style={
              {
                left: `${c.left}%`,
                width: `${c.width}px`,
                height: `${c.width * 0.42}px`,
                background: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                "--confetti-rotate": `${c.rotate}deg`,
                "--confetti-drift": `${c.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="achievement-overlay-card relative z-10 text-center">
        {type === "yatzy" && (
          <div className="achievement-dice-row" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <DiceFace key={i} value={yatzyFace} size="default" pipClassName="bg-amber-900" />
            ))}
          </div>
        )}

        {type === "large_straight" && (
          <div className="achievement-dice-row" aria-hidden>
            {STRAIGHT_DICE.map((value) => (
              <DiceFace key={value} value={value} size="default" pipClassName="bg-amber-900" />
            ))}
          </div>
        )}

        {type === "lower_complete" && (
          <div className="achievement-lower-dots" aria-hidden>
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="achievement-lower-dot" />
            ))}
          </div>
        )}

        {visual.badge && (
          <div className="achievement-overlay-badge tabular-nums">{visual.badge}</div>
        )}

        <p className="achievement-overlay-title">{visual.title}</p>
        <p className="achievement-overlay-sub">{visual.subtitle}</p>
      </div>
    </div>
  );
}
