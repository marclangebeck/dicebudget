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
const UPPER_DICE = [1, 2, 3, 4, 5, 6] as const;
const CONFETTI_SHAPES = ["rect", "star", "pip"] as const;

export function AchievementOverlay({ type, gameIndex, yatzyDieValue, onClose }: Props) {
  const visual = achievementVisual(type, gameIndex);
  const confettiCount = ACHIEVEMENT_CONFETTI_COUNT[type];

  const confetti = useMemo(
    () =>
      Array.from({ length: confettiCount }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.55,
        duration: 1.6 + Math.random() * 1.1,
        color: visual.confettiColors[i % visual.confettiColors.length],
        rotate: Math.round(Math.random() * 360),
        drift: Math.round((Math.random() - 0.5) * 110),
        width: 5 + Math.random() * 7,
        shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
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
      {type === "yatzy" && <div className="achievement-flash" aria-hidden />}

      <div className="achievement-confetti" aria-hidden>
        {confetti.map((c, i) => (
          <span
            key={i}
            className={`achievement-confetti-piece achievement-confetti-piece--${c.shape}`}
            style={
              {
                left: `${c.left}%`,
                width: `${c.width}px`,
                height: `${c.width * (c.shape === "rect" ? 0.42 : 1)}px`,
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

      <div className="achievement-burst" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="achievement-burst-ray"
            style={{ "--burst-i": i } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="achievement-overlay-card relative z-10 text-center">
        <p className="achievement-overlay-kicker">{visual.kicker}</p>

        {type === "bonus" && (
          <div className="achievement-upper-slots" aria-hidden>
            {UPPER_DICE.map((value, i) => (
              <span
                key={value}
                className="achievement-upper-slot"
                style={{ "--slot-i": i } as React.CSSProperties}
              >
                <DiceFace value={value} size="mini" pipClassName="bg-emerald-200" />
              </span>
            ))}
          </div>
        )}

        {type === "yatzy" && (
          <div className="achievement-dice-row achievement-dice-row--yatzy" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className="achievement-dice-roll"
                style={{ "--dice-i": i } as React.CSSProperties}
              >
                <DiceFace value={yatzyFace} size="default" pipClassName="bg-amber-200" />
              </span>
            ))}
          </div>
        )}

        {type === "large_straight" && (
          <>
            <div className="achievement-dice-row achievement-dice-row--straight" aria-hidden>
              {STRAIGHT_DICE.map((value, i) => (
                <span
                  key={value}
                  className="achievement-dice-roll"
                  style={{ "--dice-i": i } as React.CSSProperties}
                >
                  <DiceFace value={value} size="default" pipClassName="bg-amber-200" />
                </span>
              ))}
            </div>
            <div className="achievement-combo-line" aria-hidden />
          </>
        )}

        {type === "lower_complete" && (
          <div className="achievement-lower-ring" aria-hidden>
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                className="achievement-lower-segment"
                style={{ "--seg-i": i } as React.CSSProperties}
              />
            ))}
            <span className="achievement-lower-ring-core">✓</span>
          </div>
        )}

        {visual.badge && (
          <div className="achievement-overlay-badge tabular-nums">{visual.badge}</div>
        )}

        <p className="achievement-overlay-title">{visual.title}</p>
        <p className="achievement-overlay-sub">{visual.subtitle}</p>
        <p className="achievement-overlay-hint">Tippen zum Schließen</p>
      </div>
    </div>
  );
}
