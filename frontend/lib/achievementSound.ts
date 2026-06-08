import type { AchievementType } from "@/lib/achievementTypes";
import { getGameFeedbackEnabled } from "@/lib/uiPrefs";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

type ToneOptions = {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  release?: number;
  pan?: number;
};

function playTone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  options?: ToneOptions,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();
  const type = options?.type ?? "sine";
  const peak = options?.gain ?? 0.12;
  const attack = options?.attack ?? 0.018;
  const release = options?.release ?? Math.max(0.04, duration * 0.55);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  panner.pan.setValueAtTime(options?.pan ?? 0, startAt);

  osc.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + release + 0.02);
}

function playNoiseBurst(
  ctx: AudioContext,
  startAt: number,
  duration: number,
  options?: { gain?: number; filterHz?: number; pan?: number; q?: number },
) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(options?.filterHz ?? 2200, startAt);
  filter.Q.setValueAtTime(options?.q ?? 0.9, startAt);

  const gain = ctx.createGain();
  const peak = options?.gain ?? 0.08;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(options?.pan ?? 0, startAt);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);
  source.start(startAt);
  source.stop(startAt + duration + 0.02);
}

function playFilterSweep(
  ctx: AudioContext,
  startAt: number,
  duration: number,
  fromHz: number,
  toHz: number,
  options?: { gain?: number; type?: OscillatorType },
) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const peak = options?.gain ?? 0.06;

  osc.type = options?.type ?? "sawtooth";
  osc.frequency.setValueAtTime(fromHz, startAt);
  osc.frequency.exponentialRampToValueAtTime(Math.max(toHz, 40), startAt + duration);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, startAt);
  filter.frequency.exponentialRampToValueAtTime(5200, startAt + duration * 0.85);
  filter.Q.setValueAtTime(0.7, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function playKick(ctx: AudioContext, startAt: number, options?: { gain?: number }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const peak = options?.gain ?? 0.18;

  osc.type = "sine";
  osc.frequency.setValueAtTime(140, startAt);
  osc.frequency.exponentialRampToValueAtTime(48, startAt + 0.12);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + 0.24);
}

function playSnare(ctx: AudioContext, startAt: number, options?: { gain?: number; pan?: number }) {
  playNoiseBurst(ctx, startAt, 0.09, {
    gain: options?.gain ?? 0.1,
    filterHz: 2800,
    pan: options?.pan ?? 0,
    q: 0.6,
  });
  playTone(ctx, 180, startAt, 0.05, { type: "triangle", gain: 0.04, pan: options?.pan ?? 0 });
}

function playClick(ctx: AudioContext, startAt: number, pitch: number, pan: number) {
  playTone(ctx, pitch, startAt, 0.045, { type: "square", gain: 0.045, attack: 0.004, pan });
  playNoiseBurst(ctx, startAt, 0.025, { gain: 0.03, filterHz: 4200, pan });
}

function playBonusSound(ctx: AudioContext, t0: number) {
  playFilterSweep(ctx, t0, 0.22, 180, 880, { gain: 0.05 });
  playTone(ctx, 1174.66, t0 + 0.2, 0.28, { type: "sine", gain: 0.1 });
  playTone(ctx, 523.25, t0 + 0.28, 0.35, { type: "triangle", gain: 0.12 });
  playKick(ctx, t0 + 0.3, { gain: 0.14 });
  playNoiseBurst(ctx, t0 + 0.32, 0.12, { gain: 0.05, filterHz: 3600 });
}

function playLowerCompleteSound(ctx: AudioContext, t0: number) {
  const clicks = [440, 494, 523, 587, 659, 698, 784];
  clicks.forEach((pitch, i) => {
    const pan = -0.35 + (i / 6) * 0.7;
    playClick(ctx, t0 + i * 0.07, pitch, pan);
  });
  const chordAt = t0 + 0.52;
  playTone(ctx, 261.63, chordAt, 0.42, { type: "triangle", gain: 0.09, pan: -0.2 });
  playTone(ctx, 329.63, chordAt, 0.42, { type: "triangle", gain: 0.09 });
  playTone(ctx, 392.0, chordAt, 0.42, { type: "triangle", gain: 0.09, pan: 0.2 });
  playNoiseBurst(ctx, chordAt + 0.08, 0.35, { gain: 0.06, filterHz: 5200, q: 1.2 });
}

function playLargeStraightSound(ctx: AudioContext, t0: number) {
  const notes = [261.63, 293.66, 329.63, 349.23, 392.0];
  playKick(ctx, t0, { gain: 0.12 });
  notes.forEach((freq, i) => {
    const pan = -0.55 + (i / 4) * 1.1;
    playTone(ctx, freq, t0 + i * 0.08, 0.2, { type: "square", gain: 0.065, pan });
    playTone(ctx, freq * 2, t0 + i * 0.08, 0.14, { type: "sine", gain: 0.03, pan });
  });
  playSnare(ctx, t0 + 0.36, { gain: 0.11, pan: 0.45 });
  playFilterSweep(ctx, t0 + 0.38, 0.18, 1200, 220, { gain: 0.045, type: "triangle" });
  playNoiseBurst(ctx, t0 + 0.4, 0.2, { gain: 0.07, filterHz: 1800, pan: 0.5 });
}

function playYatzySound(ctx: AudioContext, t0: number) {
  playKick(ctx, t0, { gain: 0.28 });
  playNoiseBurst(ctx, t0, 0.18, { gain: 0.14, filterHz: 420, q: 0.5 });
  playTone(ctx, 55, t0, 0.45, { type: "sine", gain: 0.16 });

  const fanfareAt = t0 + 0.14;
  const fanfare = [392.0, 523.25, 659.25, 783.99];
  fanfare.forEach((freq, i) => {
    playTone(ctx, freq, fanfareAt + i * 0.09, 0.32, { type: "triangle", gain: 0.11 });
    playTone(ctx, freq * 1.5, fanfareAt + i * 0.09, 0.22, { type: "sine", gain: 0.05 });
  });

  playSnare(ctx, fanfareAt + 0.34, { gain: 0.14 });
  playNoiseBurst(ctx, fanfareAt + 0.36, 0.45, { gain: 0.09, filterHz: 6400, q: 1.4 });
  playNoiseBurst(ctx, fanfareAt + 0.42, 0.3, { gain: 0.07, filterHz: 8200, pan: -0.4 });
  playTone(ctx, 1046.5, fanfareAt + 0.48, 0.55, { type: "sine", gain: 0.1 });
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
