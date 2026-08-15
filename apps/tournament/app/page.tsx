"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { loadHostSession } from "@/lib/hostStore";
import { loadSetupDraft, patchSetupDraft, saveSetupDraft } from "@/lib/setupDraft";

export default function TournamentHomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setHasSaved(Boolean(loadHostSession()));
    const draft = loadSetupDraft();
    if (draft?.name) setName(draft.name);
  }, []);

  function onContinue() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Bitte einen Turniernamen eingeben.");
      return;
    }
    setError(null);
    const existing = loadSetupDraft();
    if (existing) {
      patchSetupDraft({ name: trimmed });
    } else {
      saveSetupDraft({ name: trimmed });
    }
    router.push("/setup");
  }

  function onOpenSaved() {
    const saved = loadHostSession();
    if (!saved) {
      setError("Kein gespeichertes Host-Turnier auf diesem Gerät.");
      return;
    }
    router.push(`/host?code=${encodeURIComponent(saved.inviteCode)}`);
  }

  return (
    <main className="t-shell">
      <h1 className="t-brand">{APP_NAME}</h1>
      <p className="t-tagline">{APP_TAGLINE}</p>

      <section className="t-card" aria-label="Turnier benennen">
        <label className="t-label">
          Name des Turniers
          <input
            className="t-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Freitagabend"
            maxLength={48}
            style={{ textTransform: "none", letterSpacing: "normal" }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onContinue();
            }}
          />
        </label>
        <div className="t-stack">
          <button type="button" className="t-btn" onClick={onContinue}>
            Weiter
          </button>
          {hasSaved && (
            <button type="button" className="t-btn t-btn--ghost" onClick={onOpenSaved}>
              Letztes Turnier öffnen
            </button>
          )}
        </div>
      </section>

      {error && (
        <p className="t-error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
