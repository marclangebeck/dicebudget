"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { isLabsPinConfigured, unlockLabs } from "@/lib/labsAccess";

type LabsUnlockDialogProps = {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
};

export function LabsUnlockDialog({ open, onClose, onUnlocked }: LabsUnlockDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) {
      setCode("");
      setError(null);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  const pinConfigured = isLabsPinConfigured();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!pinConfigured) {
      setError("Vorschau-Code ist in diesem Build nicht konfiguriert.");
      return;
    }
    if (!code.trim()) {
      setError("Bitte Code eingeben.");
      return;
    }
    if (unlockLabs(code)) {
      onUnlocked();
      onClose();
      return;
    }
    setError("Code ungültig.");
  }

  return (
    <div
      className="field-entry-overlay fixed inset-0 z-50 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="labs-unlock-title"
    >
      <button
        type="button"
        className="field-entry-overlay-backdrop absolute inset-0"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="field-entry-panel relative z-10 mx-4 mt-[max(1.5rem,env(safe-area-inset-top))] w-full max-w-md rounded-2xl border border-white/10 bg-[#1e2430] p-5 shadow-2xl"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Entwickler</p>
        <h2 id="labs-unlock-title" className="mt-1 text-lg font-bold text-white">
          Vorschau freischalten
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Gib deinen persönlichen Code ein, um experimentelle Features zu testen.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-400">Code</span>
            <input
              ref={inputRef}
              type="password"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              className="glass-input min-h-11 w-full px-3 text-base font-semibold"
              placeholder="Code eingeben"
            />
          </label>

          {error ? (
            <p className="text-sm font-medium text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          {!pinConfigured ? (
            <p className="text-xs text-amber-200/90">
              Hinweis: <code className="text-[0.7rem]">NEXT_PUBLIC_LABS_PIN</code> muss beim Build
              gesetzt sein (Web und iOS).
            </p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="glass-button min-h-11 flex-1 px-4 text-sm font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="glass-button glass-button--primary min-h-11 flex-1 px-4 text-sm font-semibold"
            >
              Freischalten
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
