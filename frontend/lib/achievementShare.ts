import type { AchievementType, AchievementVisual } from "@/lib/achievementTypes";
import { APP_NAME } from "@/lib/branding";
import {
  SHARE_CARD_SIZE,
  canvasToPngBlob,
  drawShareAccentGlow,
  drawShareBackground,
  drawShareBrandFooter,
  drawShareBrandHeader,
  roundShareRect,
  wrapShareText,
} from "@/lib/shareCanvasUtils";
import { appendSiteLink } from "@/lib/shareSocial";

const TYPE_ACCENT: Record<AchievementType, string> = {
  bonus: "#10b981",
  lower_complete: "#22d3ee",
  large_straight: "#fbbf24",
  yatzy: "#facc15",
};

const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.28, 0.28],
    [0.5, 0.5],
    [0.72, 0.72],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.5, 0.5],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  6: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
};

function drawDiceFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  value: number,
) {
  const half = size / 2;
  roundShareRect(ctx, cx - half, cy - half, size, size, size * 0.18);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = "rgba(15, 23, 42, 0.2)";
  ctx.lineWidth = 3;
  ctx.stroke();

  const pips = PIP_LAYOUT[value] ?? PIP_LAYOUT[1];
  const pipR = size * 0.09;
  ctx.fillStyle = "#78350f";
  for (const [px, py] of pips) {
    ctx.beginPath();
    ctx.arc(cx - half + px * size, cy - half + py * size, pipR, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  type: AchievementType,
  yatzyDieValue?: number | null,
) {
  const y = 430;
  const diceSize = 72;
  const gap = 18;

  if (type === "yatzy") {
    const face = yatzyDieValue && yatzyDieValue >= 1 && yatzyDieValue <= 6 ? yatzyDieValue : 5;
    const totalW = 5 * diceSize + 4 * gap;
    let x = SHARE_CARD_SIZE / 2 - totalW / 2 + diceSize / 2;
    for (let i = 0; i < 5; i++) {
      drawDiceFace(ctx, x, y, diceSize, face);
      x += diceSize + gap;
    }
    return;
  }

  if (type === "large_straight") {
    const values = [2, 3, 4, 5, 6];
    const totalW = values.length * diceSize + (values.length - 1) * gap;
    let x = SHARE_CARD_SIZE / 2 - totalW / 2 + diceSize / 2;
    for (const value of values) {
      drawDiceFace(ctx, x, y, diceSize, value);
      x += diceSize + gap;
    }
    return;
  }

  if (type === "bonus") {
    const totalW = 6 * 52 + 5 * 12;
    let x = SHARE_CARD_SIZE / 2 - totalW / 2 + 26;
    for (let v = 1; v <= 6; v++) {
      drawDiceFace(ctx, x, y, 52, v);
      x += 52 + 12;
    }
    return;
  }

  if (type === "lower_complete") {
    const cx = SHARE_CARD_SIZE / 2;
    const cy = y;
    const radius = 88;
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const sx = cx + Math.cos(angle) * radius;
      const sy = cy + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#22d3ee";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(8, 47, 73, 0.85)";
    ctx.fill();
    ctx.fillStyle = "#7dd3fc";
    ctx.font = "bold 42px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✓", cx, cy + 2);
  }
}

export function buildAchievementShareText(
  type: AchievementType,
  visual: AchievementVisual,
): string {
  const headline = visual.badge ? `${visual.title} (${visual.badge})` : visual.title;
  return appendSiteLink(`🎲 ${headline} — ${APP_NAME}\n${visual.subtitle}`);
}

export async function renderAchievementShareImage(params: {
  type: AchievementType;
  visual: AchievementVisual;
  yatzyDieValue?: number | null;
}): Promise<Blob> {
  const { type, visual, yatzyDieValue } = params;
  const accent = TYPE_ACCENT[type];
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_SIZE;
  canvas.height = SHARE_CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");

  drawShareBackground(ctx);
  const rgba: Record<string, string> = {
    "#10b981": "rgba(16, 185, 129, 0.22)",
    "#22d3ee": "rgba(34, 211, 238, 0.2)",
    "#fbbf24": "rgba(251, 191, 36, 0.24)",
    "#facc15": "rgba(250, 204, 21, 0.28)",
  };
  drawShareAccentGlow(ctx, rgba[accent] ?? "rgba(229, 192, 123, 0.2)");
  await drawShareBrandHeader(ctx);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#e5c07b";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText(visual.kicker.toUpperCase(), SHARE_CARD_SIZE / 2, 210);

  drawMotif(ctx, type, yatzyDieValue);

  if (visual.badge) {
    const badgeW = 220;
    const badgeH = 220;
    const bx = SHARE_CARD_SIZE / 2 - badgeW / 2;
    const by = 520;
    roundShareRect(ctx, bx, by, badgeW, badgeH, badgeH / 2);
    const badgeGrad = ctx.createLinearGradient(bx, by, bx, by + badgeH);
    badgeGrad.addColorStop(0, "#fef08a");
    badgeGrad.addColorStop(0.5, accent);
    badgeGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = badgeGrad;
    ctx.fill();
    ctx.fillStyle = type === "yatzy" ? "#422006" : "#0f172a";
    ctx.font = "800 72px system-ui, sans-serif";
    ctx.fillText(visual.badge, SHARE_CARD_SIZE / 2, by + badgeH / 2 + 26);
  }

  ctx.fillStyle = "#f8fafc";
  ctx.font = `800 ${type === "yatzy" ? 64 : 52}px system-ui, sans-serif`;
  ctx.fillText(visual.title, SHARE_CARD_SIZE / 2, visual.badge ? 820 : 720);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 30px system-ui, sans-serif";
  const subLines = wrapShareText(ctx, visual.subtitle, SHARE_CARD_SIZE - 160);
  let subY = visual.badge ? 878 : 778;
  for (const line of subLines.slice(0, 2)) {
    ctx.fillText(line, SHARE_CARD_SIZE / 2, subY);
    subY += 38;
  }

  drawShareBrandFooter(ctx);
  return canvasToPngBlob(canvas);
}
