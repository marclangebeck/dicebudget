"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";

export type GalleryLightboxItem = {
  src: string;
  alt: string;
  caption: string;
};

type GalleryLightboxProps = {
  items: readonly GalleryLightboxItem[];
  activeIndex: number | null;
  onClose: () => void;
  onActiveIndexChange: (index: number) => void;
};

export function GalleryLightbox({
  items,
  activeIndex,
  onClose,
  onActiveIndexChange,
}: GalleryLightboxProps) {
  const open = activeIndex !== null;
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  const goPrev = useCallback(() => {
    if (activeIndex === null || items.length === 0) return;
    onActiveIndexChange((activeIndex + items.length - 1) % items.length);
  }, [activeIndex, items.length, onActiveIndexChange]);

  const goNext = useCallback(() => {
    if (activeIndex === null || items.length === 0) return;
    onActiveIndexChange((activeIndex + 1) % items.length);
  }, [activeIndex, items.length, onActiveIndexChange]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, goPrev, goNext]);

  if (!open || activeIndex === null) return null;

  const item = items[activeIndex];
  if (!item) return null;

  const hasMultiple = items.length > 1;
  const counter = `${activeIndex + 1} / ${items.length}`;

  return (
    <div
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-lightbox-caption"
    >
      <button
        type="button"
        className="gallery-lightbox-backdrop"
        aria-label="Galerie schließen"
        onClick={onClose}
      />
      <div ref={dialogRef} className="gallery-lightbox-panel" tabIndex={-1}>
        <header className="gallery-lightbox-toolbar">
          <p className="gallery-lightbox-counter" aria-hidden={!hasMultiple}>
            {hasMultiple ? counter : null}
          </p>
          <button
            type="button"
            className="gallery-lightbox-close"
            onClick={onClose}
            aria-label="Schließen"
          >
            Schließen
          </button>
        </header>

        <figure className="gallery-lightbox-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.src} alt={item.alt} className="gallery-lightbox-image" />
          <figcaption id="gallery-lightbox-caption" className="gallery-lightbox-caption">
            {item.caption}
          </figcaption>
        </figure>

        {hasMultiple ? (
          <div className="gallery-lightbox-nav-row">
            <button type="button" className="gallery-lightbox-nav" onClick={goPrev}>
              Zurück
            </button>
            <button type="button" className="gallery-lightbox-nav" onClick={goNext}>
              Weiter
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
