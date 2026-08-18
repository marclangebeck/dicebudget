"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { loadHostSession } from "@/lib/hostStore";
import { goToHostLobby } from "@/lib/hostNav";
import {
  DEFAULT_LEAGUE_SETTINGS,
  DEFAULT_MATCH_PREFS,
  DEFAULT_TURNIER_SETTINGS,
} from "@/lib/eventConfig";
import { loadSetupDraft, patchSetupDraft, saveSetupDraft } from "@/lib/setupDraft";

function TournamentHomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get("new") === "1";
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const saved = loadHostSession();
    setHasSaved(Boolean(saved));
    if (saved && !forceNew) {
      goToHostLobby(saved.inviteCode);
      return;
    }
    const draft = loadSetupDraft();
    if (draft?.name) setName(draft.name);
  }, [forceNew]);

  function onContinue() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Bitte einen Event-Namen eingeben.");
      return;
    }
    setError(null);
    const existing = loadSetupDraft();
    if (existing) {
      patchSetupDraft({ name: trimmed });
    } else {
      saveSetupDraft({
        name: trimmed,
        match: DEFAULT_MATCH_PREFS,
        league: DEFAULT_LEAGUE_SETTINGS,
        turnier: DEFAULT_TURNIER_SETTINGS,
      });
    }
    router.push("/setup/");
  }

  function onOpenSaved() {
    const saved = loadHostSession();
    if (!saved) {
      setError("Kein gespeichertes Host-Event auf diesem Gerät.");
      return;
    }
    goToHostLobby(saved.inviteCode);
  }

  return (
    <main className="t-shell">
      <h1 className="t-brand">{APP_NAME}</h1>
      <p className="t-tagline">{APP_TAGLINE}</p>

      <section className="t-card" aria-label="Event benennen">
        <label className="t-label">
          Name des Events
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
            <button type="button" className="t-btn t-btn--accent" onClick={onOpenSaved}>
              Event-Lobby öffnen
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

export default function TournamentHomePage() {
  return (
    <Suspense fallback={<main className="t-shell">Lade…</main>}>
      <TournamentHomeInner />
    </Suspense>
  );
}
