import { APP_NAME, SITE_URL } from "@/lib/branding";

export const SHARE_CARD_SIZE = 1080;

export function loadShareImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Bild nicht geladen: ${src}`));
    img.src = src;
  });
}

export function roundShareRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function wrapShareText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawShareBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, SHARE_CARD_SIZE, SHARE_CARD_SIZE * 0.9);
  bg.addColorStop(0, "#141c28");
  bg.addColorStop(0.55, "#1f2b3d");
  bg.addColorStop(1, "#2a3038");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_CARD_SIZE, SHARE_CARD_SIZE);
}

export function drawShareAccentGlow(ctx: CanvasRenderingContext2D, rgbaCenter: string) {
  const glow = ctx.createRadialGradient(
    SHARE_CARD_SIZE * 0.5,
    SHARE_CARD_SIZE * 0.36,
    40,
    SHARE_CARD_SIZE * 0.5,
    SHARE_CARD_SIZE * 0.36,
    SHARE_CARD_SIZE * 0.42,
  );
  glow.addColorStop(0, rgbaCenter);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SHARE_CARD_SIZE, SHARE_CARD_SIZE);
}

export async function drawShareBrandHeader(ctx: CanvasRenderingContext2D, y = 72) {
  try {
    const logo = await loadShareImage("/apple-touch-icon.png");
    const logoSize = 88;
    ctx.save();
    roundShareRect(ctx, SHARE_CARD_SIZE / 2 - logoSize / 2, y, logoSize, logoSize, 20);
    ctx.clip();
    ctx.drawImage(logo, SHARE_CARD_SIZE / 2 - logoSize / 2, y, logoSize, logoSize);
    ctx.restore();
  } catch {
    ctx.fillStyle = "#e5c07b";
    ctx.font = "bold 52px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🎲", SHARE_CARD_SIZE / 2, y + 58);
  }
}

export function drawShareBrandFooter(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(214, 168, 90, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, SHARE_CARD_SIZE - 130);
  ctx.lineTo(SHARE_CARD_SIZE - 120, SHARE_CARD_SIZE - 130);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#e5c07b";
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.fillText(APP_NAME, SHARE_CARD_SIZE / 2, SHARE_CARD_SIZE - 82);
  ctx.fillStyle = "#64748b";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText(SITE_URL.replace(/^https:\/\//, ""), SHARE_CARD_SIZE / 2, SHARE_CARD_SIZE - 44);
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Share-Bild konnte nicht erstellt werden"));
    }, "image/png", 0.92);
  });
}
