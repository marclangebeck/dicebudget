"use client";

import { useEffect, useId, useRef } from "react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  open: boolean;
  title: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
};

/**
 * Kompaktes Auswahl-Overlay für Host-Schnellwahl (Spiele / Plätze / Modus).
 */
export function HostSetupQuickPick({
  open,
  title,
  options,
  value,
  onChange,
  onClose,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLButtonElement>(
      'button[aria-checked="true"], button[role="radio"]',
    );
    first?.focus();
  }, [open]);

  if (!open) return null;

  const columns = Math.min(options.length, 6);

  return (
    <div className="host-setup-pick-overlay" role="presentation">
      <button
        type="button"
        className="host-setup-pick-backdrop"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="host-setup-pick-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <p id={titleId} className="host-setup-pick-title">
          {title}
        </p>
        <div
          className="host-setup-pick-grid"
          role="radiogroup"
          aria-label={title}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`host-setup-pick-option${selected ? " is-selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  onClose();
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <button type="button" className="host-setup-pick-cancel" onClick={onClose}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
