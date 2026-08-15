"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/branding";
import { loadSetupDraft, patchSetupDraft } from "@/lib/setupDraft";
import {
  DEFAULT_MAX_ENTRIES,
  MAX_ENTRIES_PRESETS,
  MAX_MAX_ENTRIES,
  MIN_MAX_ENTRIES,
  TOURNAMENT_MODE_OPTIONS,
  clampMaxEntries,
} from "@/lib/tournamentModes";

export default function SetupSizePage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [modeLabel, setModeLabel] = useState("");
  const [maxEntries, setMaxEntries] = useState(DEFAULT_MAX_ENTRIES);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || !draft.modeKey) {
      router.replace(draft?.name.trim() ? "/setup" : "/");
      return;
    }
    setName(draft.name.trim());
    const mode = TOURNAMENT_MODE_OPTIONS.find((o) => o.key === draft.modeKey);
    setModeLabel(mode?.label ?? draft.modeKey);
    setMaxEntries(draft.maxEntries ?? DEFAULT_MAX_ENTRIES);
  }, [router]);

  function onContinue() {
    const n = clampMaxEntries(maxEntries);
    if (n < MIN_MAX_ENTRIES || n > MAX_MAX_ENTRIES) {
      setError(`Spielerzahl zwischen ${MIN_MAX_ENTRIES} und ${MAX_MAX_ENTRIES}.`);
      return;
    }
    const next = patchSetupDraft({ maxEntries: n });
    if (!next) {
      router.replace("/");
      return;
    }
    router.push("/setup/review");
  }

  if (!name) {
    return (
      <main className="t-shell">
        <p className="t-meta">Lade…</p>
      </main>
    );
  }

  return (
    <main className="t-shell">
      <p className="t-meta">{APP_NAME} · Schritt 2</p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        Größe
      </h1>
      <p className="t-meta">
        {name} · {modeLabel}
      </p>

      <section className="t-card" aria-label="Maximale Spielerzahl">
        <p className="t-label" style={{ marginBottom: "0.65rem" }}>
          Maximale Spielerzahl
        </p>
        <div className="t-choice-grid">
          {MAX_ENTRIES_PRESETS.map((preset) => {
            const selected = maxEntries === preset;
            return (
              <button
                key={preset}
                type="button"
                className={`t-choice t-choice--compact${selected ? " t-choice--selected" : ""}`}
                aria-pressed={selected}
                onClick={() => {
                  setMaxEntries(preset);
                  setError(null);
                }}
              >
                <span className="t-choice-title">{preset}</span>
              </button>
            );
          })}
        </div>
        <label className="t-label" style={{ marginTop: "1rem", marginBottom: 0 }}>
          Oder eigene Zahl ({MIN_MAX_ENTRIES}–{MAX_MAX_ENTRIES})
          <input
            className="t-input"
            type="number"
            inputMode="numeric"
            min={MIN_MAX_ENTRIES}
            max={MAX_MAX_ENTRIES}
            value={maxEntries}
            onChange={(e) => {
              const raw = Number(e.target.value);
              if (Number.isFinite(raw)) {
                setMaxEntries(raw);
                setError(null);
              }
            }}
            style={{ textTransform: "none", letterSpacing: "normal" }}
          />
        </label>
      </section>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <Link href="/setup" className="t-btn t-btn--ghost">
          Zurück
        </Link>
        <button type="button" className="t-btn" onClick={onContinue}>
          Weiter
        </button>
      </div>

      {error && (
        <p className="t-error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
