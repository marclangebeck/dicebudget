"use client";

import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";

type Props = {
  open: boolean;
  previewUrl: string | null;
  sharing: boolean;
  onShare: () => void;
  onDiscard: () => void;
};

export function ScreenshotPreviewDialog({
  open,
  previewUrl,
  sharing,
  onShare,
  onDiscard,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDiscard();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onDiscard]);

  if (!open || !previewUrl) return null;

  return (
    <div
      className="screenshot-preview-overlay"
      data-capture-exclude="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="screenshot-preview-title"
    >
      <button
        type="button"
        className="screenshot-preview-backdrop"
        aria-label="Vorschau schließen"
        onClick={onDiscard}
      />
      <div ref={dialogRef} className="screenshot-preview-panel">
        <header className="screenshot-preview-head">
          <p id="screenshot-preview-title" className="screenshot-preview-title">
            Screenshot-Vorschau
          </p>
          <p className="screenshot-preview-subtitle">So wird das Bild aussehen.</p>
        </header>

        <div className="screenshot-preview-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Screenshot-Vorschau"
            className="screenshot-preview-image"
          />
        </div>

        <div className="screenshot-preview-actions">
          <button
            type="button"
            className="glass-button min-h-11 px-4 text-sm font-semibold"
            onClick={onDiscard}
            disabled={sharing}
          >
            Verwerfen
          </button>
          <button
            type="button"
            className="glass-button glass-button--primary min-h-11 px-4 text-sm font-semibold"
            onClick={onShare}
            disabled={sharing}
          >
            {sharing ? "Teile …" : "Teilen"}
          </button>
        </div>
      </div>
    </div>
  );
}
