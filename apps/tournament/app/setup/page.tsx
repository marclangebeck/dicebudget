"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/branding";
import { loadSetupDraft, patchSetupDraft } from "@/lib/setupDraft";
import {
  TOURNAMENT_MODE_OPTIONS,
  type TournamentModeKey,
} from "@/lib/tournamentModes";

export default function SetupFormatPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [modeKey, setModeKey] = useState<TournamentModeKey>("league");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim()) {
      router.replace("/");
      return;
    }
    setName(draft.name.trim());
    if (draft.modeKey) setModeKey(draft.modeKey);
  }, [router]);

  function onContinue() {
    const option = TOURNAMENT_MODE_OPTIONS.find((o) => o.key === modeKey);
    if (!option?.available) {
      setError("Dieses Format ist noch nicht verfügbar.");
      return;
    }
    const next = patchSetupDraft({ modeKey });
    if (!next) {
      router.replace("/");
      return;
    }
    router.push("/setup/size");
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
      <p className="t-meta">{APP_NAME} · Schritt 1</p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        Format
      </h1>
      <p className="t-meta">
        Turnier: <strong style={{ color: "var(--ink)" }}>{name}</strong>
      </p>

      <section className="t-card" aria-label="Turnierformat wählen">
        <p className="t-label" style={{ marginBottom: "0.65rem" }}>
          Wie soll gespielt werden?
        </p>
        <div className="t-stack" style={{ width: "100%" }}>
          {TOURNAMENT_MODE_OPTIONS.map((option) => {
            const selected = modeKey === option.key;
            return (
              <button
                key={option.key}
                type="button"
                className={`t-choice${selected ? " t-choice--selected" : ""}`}
                disabled={!option.available}
                aria-pressed={selected}
                onClick={() => {
                  if (option.available) {
                    setModeKey(option.key);
                    setError(null);
                  }
                }}
              >
                <span className="t-choice-title">
                  {option.label}
                  {!option.available ? " · folgt" : ""}
                </span>
                <span className="t-choice-desc">{option.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <Link href="/" className="t-btn t-btn--ghost">
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
