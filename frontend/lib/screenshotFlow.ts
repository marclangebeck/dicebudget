const SCREEN_PAINT_DELAY_MS = 180;
export const SCREENSHOT_FLASH_MS = 280;

/** Menü/Overlays schließen, dann kurz warten bis der Screen sichtbar ist. */
export async function waitForScreenPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((resolve) => window.setTimeout(resolve, SCREEN_PAINT_DELAY_MS));
}

export function flashDelay(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, SCREENSHOT_FLASH_MS));
}
