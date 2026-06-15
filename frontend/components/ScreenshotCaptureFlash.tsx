"use client";

type Props = {
  active: boolean;
};

/** Kurzer Kamera-Blitz — zeigt an, welcher Bereich erfasst wird. */
export function ScreenshotCaptureFlash({ active }: Props) {
  if (!active) return null;

  return (
    <div
      className="screenshot-capture-flash"
      data-capture-exclude="true"
      aria-hidden
    />
  );
}
