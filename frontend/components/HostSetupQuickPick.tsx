"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

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

const ITEM_HEIGHT = 44;

/**
 * iOS-artiger Walzen-Picker (wie Timer/Datum) für Host-Schnellwahl.
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
  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const [draft, setDraft] = useState(value);

  const indexOfValue = useCallback(
    (raw: string) => {
      const idx = options.findIndex((option) => option.value === raw);
      return idx >= 0 ? idx : 0;
    },
    [options],
  );

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "auto") => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: index * ITEM_HEIGHT, behavior });
  }, []);

  const syncDraftFromScroll = useCallback(() => {
    const list = listRef.current;
    if (!list || options.length === 0) return;
    const index = Math.min(
      options.length - 1,
      Math.max(0, Math.round(list.scrollTop / ITEM_HEIGHT)),
    );
    const next = options[index]?.value;
    if (next) setDraft(next);
    const target = index * ITEM_HEIGHT;
    if (Math.abs(list.scrollTop - target) > 0.5) {
      list.scrollTo({ top: target, behavior: "smooth" });
    }
  }, [options]);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const frame = window.requestAnimationFrame(() => {
      scrollToIndex(indexOfValue(value), "auto");
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(frame);
      if (settleTimer.current != null) window.clearTimeout(settleTimer.current);
    };
  }, [open, value, indexOfValue, onClose, scrollToIndex]);

  function onScroll() {
    if (settleTimer.current != null) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      syncDraftFromScroll();
    }, 80);
  }

  if (!open) return null;

  const draftIndex = indexOfValue(draft);

  return (
    <div className="host-setup-pick-overlay" role="presentation">
      <button
        type="button"
        className="host-setup-pick-backdrop"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div
        className="host-setup-pick-panel host-setup-pick-panel--wheel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="host-setup-pick-toolbar">
          <button type="button" className="host-setup-pick-toolbar-btn" onClick={onClose}>
            Abbrechen
          </button>
          <p id={titleId} className="host-setup-pick-title">
            {title}
          </p>
          <button
            type="button"
            className="host-setup-pick-toolbar-btn host-setup-pick-toolbar-btn--done"
            onClick={() => {
              onChange(draft);
              onClose();
            }}
          >
            Fertig
          </button>
        </div>

        <div className="host-setup-wheel" aria-label={title}>
          <div className="host-setup-wheel-highlight" aria-hidden />
          <div className="host-setup-wheel-fade host-setup-wheel-fade--top" aria-hidden />
          <div className="host-setup-wheel-fade host-setup-wheel-fade--bottom" aria-hidden />
          <div
            ref={listRef}
            className="host-setup-wheel-list"
            onScroll={onScroll}
            role="listbox"
            aria-activedescendant={`host-wheel-opt-${draft}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = Math.min(options.length - 1, draftIndex + 1);
                setDraft(options[next]!.value);
                scrollToIndex(next, "smooth");
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const next = Math.max(0, draftIndex - 1);
                setDraft(options[next]!.value);
                scrollToIndex(next, "smooth");
              } else if (e.key === "Enter") {
                e.preventDefault();
                onChange(draft);
                onClose();
              }
            }}
          >
            {options.map((option, index) => {
              const selected = option.value === draft;
              const distance = Math.abs(index - draftIndex);
              return (
                <button
                  key={option.value}
                  id={`host-wheel-opt-${option.value}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`host-setup-wheel-item${selected ? " is-selected" : ""}`}
                  style={{
                    opacity: distance === 0 ? 1 : distance === 1 ? 0.45 : 0.22,
                    transform: `scale(${distance === 0 ? 1.08 : distance === 1 ? 0.94 : 0.88})`,
                  }}
                  onClick={() => {
                    setDraft(option.value);
                    scrollToIndex(index, "smooth");
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
