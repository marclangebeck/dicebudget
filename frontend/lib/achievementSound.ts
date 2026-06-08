import type { AchievementType } from "@/lib/achievementTypes";
import { getGameFeedbackEnabled } from "@/lib/uiPrefs";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function prefersReducedFeedback(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  options?: { type?: OscillatorType; gain?: number; attack?: number },
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const type = options?.type ?? "sine";
  const peak = options?.gain ?? 0.12;
  const attack = options?.attack ?? 0.02;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function playBonusSound(ctx: AudioContext, t0: number) {
  playTone(ctx, 261.63, t0, 0.22, { gain: 0.1 });
  playTone(ctx, 329.63, t0 + 0.1, 0.22, { gain: 0.1 });
  playTone(ctx, 392.0, t0 + 0.2, 0.32, { gain: 0.12 });
}

function playLowerCompleteSound(ctx: AudioContext, t0: number) {
  playTone(ctx, 392.0, t0, 0.28, { type: "triangle", gain: 0.11 });
  playTone(ctx, 523.25, t0 + 0.16, 0.36, { type: "triangle", gain: 0.13 });
}

function playLargeStraightSound(ctx: AudioContext, t0: number) {
  const notes = [261.63, 293.66, 329.63, 349.23, 392.0];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, t0 + i * 0.07, 0.18, { type: "square", gain: 0.07 });
  });
}

function playYatzySound(ctx: AudioContext, t0: number) {
  playTone(ctx, 98.0, t0, 0.35, { type: "sine", gain: 0.14 });
  playTone(ctx, 392.0, t0 + 0.05, 0.22, { gain: 0.11 });
  playTone(ctx, 523.25, t0 + 0.14, 0.22, { gain: 0.12 });
  playTone(ctx, 659.25, t0 + 0.24, 0.45, { gain: 0.14 });
}

export function playAchievementSound(type: AchievementType): void {
  if (!getGameFeedbackEnabled() || prefersReducedFeedback()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const t0 = ctx.currentTime + 0.02;
  switch (type) {
    case "bonus":
      playBonusSound(ctx, t0);
      break;
    case "lower_complete":
      playLowerCompleteSound(ctx, t0);
      break;
    case "large_straight":
      playLargeStraightSound(ctx, t0);
      break;
    case "yatzy":
      playYatzySound(ctx, t0);
      break;
  }
}
