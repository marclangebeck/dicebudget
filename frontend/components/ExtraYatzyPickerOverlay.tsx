"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { YatzyDiePicker } from "@/components/YatzyDiePicker";

type AnchorRect = {
  top: number;
  left: number;
  bottom: number;
};

type Props = {
  anchor: AnchorRect;
  disabled?: boolean;
  onPick: (value: number) => void;
  onClose: () => void;
};

const POPOVER_EST_HEIGHT = 88;

function computePopoverTop(anchor: AnchorRect): number {
  const spaceBelow = window.innerHeight - anchor.bottom;
  if (spaceBelow >= POPOVER_EST_HEIGHT + 8) {
    return anchor.bottom + 4;
  }
  return Math.max(8, anchor.top - POPOVER_EST_HEIGHT - 4);
}

function computePopoverLeft(anchor: AnchorRect, popoverWidth: number): number {
  const maxLeft = window.innerWidth - popoverWidth - 8;
  return Math.min(Math.max(8, anchor.left), Math.max(8, maxLeft));
}

export function ExtraYatzyPickerOverlay({
  anchor,
  disabled,
  onPick,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: anchor.bottom + 4, left: anchor.left });

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    const update = () => {
      const el = document.querySelector(".play-yatzy-picker-popover");
      const width = el instanceof HTMLElement ? el.offsetWidth : 152;
      setPosition({
        top: computePopoverTop(anchor),
        left: computePopoverLeft(anchor, width),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [anchor]);

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="play-yatzy-picker-backdrop"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div
        className="play-yatzy-picker-popover"
        style={{ top: position.top, left: position.left }}
        role="dialog"
        aria-label="Alle Fünfe mit Würfel wählen"
      >
        <p className="play-yatzy-picker-label">Alle Fünfe mit Würfel</p>
        <YatzyDiePicker
          compact
          disabled={disabled}
          onPick={onPick}
        />
      </div>
    </>,
    document.body,
  );
}
