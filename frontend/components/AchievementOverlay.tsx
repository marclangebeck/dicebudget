"use client";

import { useEffect, useMemo, useRef } from "react";
import { DiceFace } from "@/components/DiceFace";
import { APP_NAME } from "@/lib/branding";
import {
  ACHIEVEMENT_CONFETTI_COUNT,
  achievementVisual,
  type AchievementType,
} from "@/lib/achievementTypes";
import { useFocusTrap } from "@/lib/useFocusTrap";

type Props = {
  type: AchievementType;
  gameIndex?: number | null;
  yatzyDieValue?: number | null;
  onClose: () => void;
};

const STRAIGHT_DICE = [2, 3, 4, 5, 6] as const;
const UPPER_DICE = [1, 2, 3, 4, 5, 6] as const;
const CONFETTI_SHAPES = ["rect", "star", "pip"] as const;

const SCENE_SPARK_COUNT = 28;
const ORBIT_COUNT = 14;
const COIN_COUNT = 22;

export function AchievementOverlay({ type, gameIndex, yatzyDieValue, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useFocusTrap(overlayRef, true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
        width: 8 + Math.random() * 12,
        shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
      })),
    [confettiCount, visual.confettiColors],
  );

  const sceneSparks = useMemo(
    () =>
      Array.from({ length: SCENE_SPARK_COUNT }, (_, i) => ({
        left: 8 + Math.random() * 84,
        top: 10 + Math.random() * 72,
        delay: (i % 5) * 0.12 + Math.random() * 0.5,
        size: 3 + Math.random() * 5,
        drift: Math.round((Math.random() - 0.5) * 60),
      })),
    [],
  );

  const orbitSparks = useMemo(
    () =>
      Array.from({ length: ORBIT_COUNT }, (_, i) => ({
        delay: i * 0.07,
        radius: 14 + (i % 3) * 5,
        duration: 2.4 + (i % 4) * 0.35,
      })),
    [],
  );

  const coins = useMemo(
    () =>
      type === "bonus"
        ? Array.from({ length: COIN_COUNT }, (_, i) => ({
            left: 12 + ((i * 17) % 76) + Math.random() * 8,
            delay: 0.1 + (i % 4) * 0.08 + Math.random() * 0.45,
            duration: 1.4 + Math.random() * 0.9,
            size: 0.9 + Math.random() * 0.75,
            spin: Math.round(Math.random() * 360),
          }))
        : [],
    [type],
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
      ref={overlayRef}
      className={`achievement-overlay achievement-overlay--${type} achievement-overlay--celebrate fixed inset-0 z-50 flex items-center justify-center`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-overlay-title"
      aria-live="polite"
      onClick={onClose}
    >
      <div className="achievement-scene" aria-hidden>
        <div className="achievement-scene-aurora" />
        <div className="achievement-scene-vignette" />
        {sceneSparks.map((spark, i) => (
          <span
            key={`spark-${i}`}
            className="achievement-scene-spark"
            style={
              {
                left: `${spark.left}%`,
                top: `${spark.top}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                animationDelay: `${spark.delay}s`,
                "--spark-drift": `${spark.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="achievement-edge-glow" aria-hidden />
      <div className="achievement-shockwave achievement-shockwave--1" aria-hidden />
      <div className="achievement-shockwave achievement-shockwave--2" aria-hidden />

      {type === "yatzy" && (
        <>
          <div className="achievement-flash" aria-hidden />
          <div className="achievement-jackpot-rays" aria-hidden>
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                className="achievement-jackpot-ray"
                style={{ "--ray-i": i } as React.CSSProperties}
              />
            ))}
          </div>
        </>
      )}

      {type === "large_straight" && (
        <div className="achievement-lightning-bolts" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <span
              key={i}
              className="achievement-lightning-bolt"
              style={{ "--bolt-i": i } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {type === "lower_complete" && (
        <div className="achievement-hex-grid" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="achievement-hex-cell"
              style={{ "--hex-i": i } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {type === "bonus" && (
        <div className="achievement-coin-fountain" aria-hidden>
          {coins.map((coin, i) => (
            <span
              key={i}
              className="achievement-coin"
              style={
                {
                  left: `${coin.left}%`,
                  animationDelay: `${coin.delay}s`,
                  animationDuration: `${coin.duration}s`,
                  width: `${coin.size}rem`,
                  height: `${coin.size}rem`,
                  "--coin-spin": `${coin.spin}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

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

      <div className="achievement-orbit" aria-hidden>
        {orbitSparks.map((orbit, i) => (
          <span
            key={i}
            className="achievement-orbit-spark"
            style={
              {
                animationDelay: `${orbit.delay}s`,
                animationDuration: `${orbit.duration}s`,
                "--orbit-radius": `${orbit.radius}vmin`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="achievement-burst" aria-hidden>
        {Array.from({ length: 16 }, (_, i) => (
          <span
            key={i}
            className="achievement-burst-ray"
            style={{ "--burst-i": i } as React.CSSProperties}
          />
        ))}
      </div>

      <div
        className="achievement-overlay-card achievement-share-frame relative z-10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {type === "yatzy" && (
          <div className="achievement-crown" aria-hidden>
            <span className="achievement-crown-gem" />
          </div>
        )}

        <div className="achievement-share-brand" aria-hidden>
          <img src="/apple-touch-icon.png" alt="" className="achievement-share-brand-icon" />
          <span className="achievement-share-brand-name">{APP_NAME}</span>
        </div>

        <p className="achievement-overlay-kicker">{visual.kicker}</p>

        {type === "bonus" && (
          <div className="achievement-upper-slots" aria-hidden>
            {UPPER_DICE.map((value, i) => (
              <span
                key={value}
                className="achievement-upper-slot"
                style={{ "--slot-i": i } as React.CSSProperties}
              >
                <DiceFace value={value} size="default" pipClassName="bg-emerald-200" />
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
                <DiceFace value={yatzyFace} size="hero" pipClassName="bg-amber-200" />
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
                  <DiceFace value={value} size="hero" pipClassName="bg-amber-200" />
                </span>
              ))}
            </div>
            <div className="achievement-combo-line" aria-hidden />
            <div className="achievement-combo-sparks" aria-hidden>
              {STRAIGHT_DICE.map((_, i) => (
                <span
                  key={i}
                  className="achievement-combo-spark"
                  style={{ "--spark-i": i } as React.CSSProperties}
                />
              ))}
            </div>
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
            <span className="achievement-lower-ring-pulse" />
          </div>
        )}

        {visual.badge && (
          <div className="achievement-overlay-badge tabular-nums">{visual.badge}</div>
        )}

        <p id="achievement-overlay-title" className="achievement-overlay-title">{visual.title}</p>
        <p className="achievement-overlay-sub">{visual.subtitle}</p>

        <p className="achievement-overlay-hint">Außerhalb tippen zum Schließen</p>
      </div>
    </div>
  );
}
