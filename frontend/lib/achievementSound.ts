import type { AchievementType } from "@/lib/achievementTypes";
import { getFeedbackSoundsEnabled } from "@/lib/gameFeedbackPrefs";

let audioCtx: AudioContext | null = null;
let unlockListenersBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

/**
 * iOS/WebView: AudioContext nur nach User-Gesture zuverlässig „running“.
 * Synchron im Tap-Handler aufrufen (vor await completeField), sonst fallen Töne aus.
 * Sounds hängen bewusst nicht an prefers-reduced-motion — nur am Sounds-Toggle.
 */
export function unlockAchievementAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    /* ignore unlock failures */
  }
}

function bindAudioUnlockListeners(): void {
  if (typeof window === "undefined" || unlockListenersBound) return;
  unlockListenersBound = true;
  const unlock = () => unlockAchievementAudio();
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}

async function withRunningAudioContext(
  play: (ctx: AudioContext) => void,
): Promise<void> {
  bindAudioUnlockListeners();
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  if (ctx.state !== "running") return;
  play(ctx);
}

type ToneOptions = {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  release?: number;
  pan?: number;
  detune?: number;
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
  if (options?.detune) osc.detune.setValueAtTime(options.detune, startAt);
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

function playChord(
  ctx: AudioContext,
  startAt: number,
  frequencies: number[],
  duration: number,
  options?: { gain?: number; type?: OscillatorType; pan?: number },
) {
  const perVoice = (options?.gain ?? 0.1) / frequencies.length;
  frequencies.forEach((freq, i) => {
    playTone(ctx, freq, startAt, duration, {
      type: options?.type ?? "triangle",
      gain: perVoice,
      pan: (options?.pan ?? 0) + (i - (frequencies.length - 1) / 2) * 0.08,
      detune: (i % 2 === 0 ? -6 : 6),
    });
  });
}

function playNoiseBurst(
  ctx: AudioContext,
  startAt: number,
  duration: number,
  options?: { gain?: number; filterHz?: number; pan?: number; q?: number; type?: BiquadFilterType },
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
  filter.type = options?.type ?? "bandpass";
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
  options?: { gain?: number; type?: OscillatorType; pan?: number },
) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();
  const peak = options?.gain ?? 0.06;

  osc.type = options?.type ?? "sawtooth";
  osc.frequency.setValueAtTime(fromHz, startAt);
  osc.frequency.exponentialRampToValueAtTime(Math.max(toHz, 40), startAt + duration);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, startAt);
  filter.frequency.exponentialRampToValueAtTime(7200, startAt + duration * 0.85);
  filter.Q.setValueAtTime(0.7, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  panner.pan.setValueAtTime(options?.pan ?? 0, startAt);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function playKick(ctx: AudioContext, startAt: number, options?: { gain?: number; pitch?: number }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const peak = options?.gain ?? 0.18;
  const pitch = options?.pitch ?? 140;

  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch, startAt);
  osc.frequency.exponentialRampToValueAtTime(Math.max(36, pitch * 0.34), startAt + 0.14);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.24);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + 0.26);
}

function playSnare(ctx: AudioContext, startAt: number, options?: { gain?: number; pan?: number }) {
  playNoiseBurst(ctx, startAt, 0.11, {
    gain: options?.gain ?? 0.12,
    filterHz: 3200,
    pan: options?.pan ?? 0,
    q: 0.55,
    type: "highpass",
  });
  playTone(ctx, 220, startAt, 0.06, { type: "triangle", gain: 0.05, pan: options?.pan ?? 0 });
}

function playShimmer(
  ctx: AudioContext,
  startAt: number,
  baseHz: number,
  steps: number,
  stepMs: number,
  options?: { gain?: number },
) {
  for (let i = 0; i < steps; i++) {
    const pan = -0.65 + (i / Math.max(1, steps - 1)) * 1.3;
    playTone(ctx, baseHz * Math.pow(2, i / 6), startAt + i * stepMs, stepMs * 2.2, {
      type: "sine",
      gain: (options?.gain ?? 0.07) * (1 - i * 0.04),
      pan,
      attack: 0.003,
    });
    playTone(ctx, baseHz * Math.pow(2, i / 6) * 2, startAt + i * stepMs + 0.01, stepMs * 1.6, {
      type: "triangle",
      gain: 0.025,
      pan,
    });
  }
}

function playArpeggio(
  ctx: AudioContext,
  startAt: number,
  notes: number[],
  spacing: number,
  options?: { gain?: number; type?: OscillatorType },
) {
  notes.forEach((freq, i) => {
    playTone(ctx, freq, startAt + i * spacing, spacing * 1.8, {
      type: options?.type ?? "square",
      gain: options?.gain ?? 0.055,
      pan: -0.5 + (i / Math.max(1, notes.length - 1)) * 1,
      attack: 0.005,
    });
  });
}

function playBonusSound(ctx: AudioContext, t0: number) {
  playFilterSweep(ctx, t0, 0.35, 120, 1400, { gain: 0.07, type: "sawtooth", pan: -0.25 });
  playKick(ctx, t0 + 0.28, { gain: 0.2, pitch: 110 });
  playShimmer(ctx, t0 + 0.32, 523.25, 5, 0.06, { gain: 0.09 });
  playChord(ctx, t0 + 0.62, [523.25, 659.25, 783.99, 1046.5], 0.55, {
    gain: 0.22,
    type: "triangle",
  });
  playNoiseBurst(ctx, t0 + 0.7, 0.4, { gain: 0.08, filterHz: 6800, q: 1.5, type: "bandpass" });
  playTone(ctx, 1318.5, t0 + 0.78, 0.35, { type: "sine", gain: 0.08, pan: 0.35 });
}

function playLowerCompleteSound(ctx: AudioContext, t0: number) {
  const powerNotes = [196.0, 246.94, 293.66, 349.23, 392.0, 493.88, 587.33];
  powerNotes.forEach((freq, i) => {
    const pan = -0.55 + (i / 6) * 1.1;
    playTone(ctx, freq, t0 + i * 0.055, 0.12, { type: "square", gain: 0.05, pan, attack: 0.003 });
    playTone(ctx, freq * 2, t0 + i * 0.055 + 0.02, 0.08, { type: "sine", gain: 0.028, pan });
  });
  const hit = t0 + 0.42;
  playKick(ctx, hit, { gain: 0.22 });
  playChord(ctx, hit + 0.04, [261.63, 329.63, 392.0, 523.25], 0.65, { gain: 0.24, type: "sawtooth" });
  playSnare(ctx, hit + 0.12, { gain: 0.1, pan: 0.4 });
  playFilterSweep(ctx, hit + 0.14, 0.28, 2400, 480, { gain: 0.06, type: "triangle", pan: -0.3 });
  playShimmer(ctx, hit + 0.2, 440, 4, 0.05, { gain: 0.08 });
}

function playLargeStraightSound(ctx: AudioContext, t0: number) {
  const cascade = [261.63, 293.66, 329.63, 349.23, 392.0, 523.25];
  playKick(ctx, t0, { gain: 0.16 });
  cascade.forEach((freq, i) => {
    const at = t0 + 0.06 + i * 0.09;
    const pan = -0.6 + (i / 5) * 1.2;
    playTone(ctx, freq, at, 0.22, { type: "square", gain: 0.075, pan });
    playTone(ctx, freq * 1.5, at, 0.14, { type: "sine", gain: 0.035, pan });
    if (i > 0) playNoiseBurst(ctx, at, 0.05, { gain: 0.04, filterHz: 5000, pan });
  });
  const climax = t0 + 0.58;
  playSnare(ctx, climax, { gain: 0.14, pan: 0.15 });
  playSnare(ctx, climax + 0.08, { gain: 0.12, pan: -0.2 });
  playChord(ctx, climax + 0.02, [392.0, 493.88, 587.33, 783.99], 0.5, { gain: 0.2, type: "triangle" });
  playFilterSweep(ctx, climax + 0.05, 0.22, 1800, 220, { gain: 0.07, type: "sawtooth" });
  playNoiseBurst(ctx, climax + 0.08, 0.35, { gain: 0.1, filterHz: 2400, type: "lowpass", pan: 0.45 });
}

function playYatzySound(ctx: AudioContext, t0: number) {
  playKick(ctx, t0, { gain: 0.34, pitch: 80 });
  playNoiseBurst(ctx, t0, 0.22, { gain: 0.16, filterHz: 280, q: 0.4, type: "lowpass" });
  playFilterSweep(ctx, t0 + 0.02, 0.45, 90, 2200, { gain: 0.09, type: "sawtooth" });

  const fanfareAt = t0 + 0.18;
  playArpeggio(ctx, fanfareAt, [392.0, 523.25, 659.25, 783.99, 1046.5, 1318.5], 0.075, {
    gain: 0.07,
    type: "square",
  });
  playChord(ctx, fanfareAt + 0.48, [523.25, 659.25, 783.99, 1046.5], 0.75, { gain: 0.26, type: "triangle" });

  playSnare(ctx, fanfareAt + 0.52, { gain: 0.16 });
  playSnare(ctx, fanfareAt + 0.6, { gain: 0.14, pan: -0.35 });
  playKick(ctx, fanfareAt + 0.62, { gain: 0.28, pitch: 95 });

  playShimmer(ctx, fanfareAt + 0.66, 880, 6, 0.045, { gain: 0.1 });
  playNoiseBurst(ctx, fanfareAt + 0.7, 0.55, { gain: 0.11, filterHz: 7200, q: 1.6 });
  playNoiseBurst(ctx, fanfareAt + 0.76, 0.4, { gain: 0.09, filterHz: 9200, pan: -0.5, type: "highpass" });
  playTone(ctx, 1567.98, fanfareAt + 0.82, 0.7, { type: "sine", gain: 0.12 });
  playTone(ctx, 2093.0, fanfareAt + 0.86, 0.55, { type: "triangle", gain: 0.06, pan: 0.4 });
}

export function playProgressMilestoneSound(percent: 25 | 50 | 75): void {
  if (!getFeedbackSoundsEnabled()) return;
  void withRunningAudioContext((ctx) => {
    const t0 = ctx.currentTime + 0.02;
    const base = percent === 25 ? 392 : percent === 50 ? 523.25 : 659.25;
    playTone(ctx, base, t0, 0.22, { type: "triangle", gain: 0.14, pan: -0.15 });
    playTone(ctx, base * 1.25, t0 + 0.12, 0.28, { type: "sine", gain: 0.1, pan: 0.2 });
    playChord(ctx, t0 + 0.22, [base, base * 1.5], 0.35, { gain: 0.12, type: "triangle" });
  });
}

/**
 * Kurzer Belohnungs-Ping für Eintrag mit genau 1 Wurf (Strategy).
 * Leiser und kürzer als Achievement-Sounds.
 */
export function playFirstRollRewardSound(): void {
  if (!getFeedbackSoundsEnabled()) return;
  void withRunningAudioContext((ctx) => {
    const t0 = ctx.currentTime + 0.015;
    playTone(ctx, 1046.5, t0, 0.12, { type: "sine", gain: 0.09, pan: -0.12, attack: 0.01 });
    playTone(ctx, 1318.5, t0 + 0.08, 0.18, { type: "triangle", gain: 0.07, pan: 0.15, attack: 0.012 });
  });
}

/**
 * Kurze Fanfare zum Gold-Aufleuchten (Zeile / Spalte / gesamter Zettel).
 * Respektiert den Sounds-Toggle.
 */
export function playSheetGoldFanfareSound(): void {
  if (!getFeedbackSoundsEnabled()) return;
  void withRunningAudioContext((ctx) => {
    const t0 = ctx.currentTime + 0.02;
    playKick(ctx, t0, { gain: 0.2, pitch: 100 });
    playArpeggio(ctx, t0 + 0.04, [392.0, 523.25, 659.25, 783.99], 0.07, {
      gain: 0.08,
      type: "square",
    });
    playChord(ctx, t0 + 0.36, [523.25, 659.25, 783.99, 1046.5], 0.55, {
      gain: 0.22,
      type: "triangle",
    });
    playSnare(ctx, t0 + 0.38, { gain: 0.12, pan: 0.2 });
    playTone(ctx, 1318.5, t0 + 0.48, 0.35, { type: "sine", gain: 0.09, pan: -0.2 });
    playShimmer(ctx, t0 + 0.5, 660, 4, 0.05, { gain: 0.07 });
  });
}

/** Ob der Einswurf-Ping gespielt werden soll (ohne Parallel-Lärm zu Achievements). */
export function shouldPlayFirstRollReward(input: {
  useStrategyRules: boolean;
  rollsUsed: number;
  score: number;
  isCorrection: boolean;
  rollSaleEntry: boolean;
  hasAchievement: boolean;
}): boolean {
  return (
    input.useStrategyRules &&
    !input.rollSaleEntry &&
    !input.isCorrection &&
    !input.hasAchievement &&
    input.rollsUsed === 1 &&
    input.score > 0
  );
}

export function playAchievementSound(type: AchievementType): void {
  if (!getFeedbackSoundsEnabled()) return;
  void withRunningAudioContext((ctx) => {
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
  });
}
