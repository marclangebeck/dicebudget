"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTournament } from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import { saveHostSession } from "@/lib/hostStore";
import { clearSetupDraft, loadSetupDraft } from "@/lib/setupDraft";
import { TOURNAMENT_MODE_OPTIONS } from "@/lib/tournamentModes";

export default function SetupReviewPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [modeKey, setModeKey] = useState<string | null>(null);
  const [modeLabel, setModeLabel] = useState("");
  const [maxEntries, setMaxEntries] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || !draft.modeKey || !draft.maxEntries) {
      if (!draft?.name.trim()) router.replace("/");
      else if (!draft.modeKey) router.replace("/setup");
      else router.replace("/setup/size");
      return;
    }
    setName(draft.name.trim());
    setModeKey(draft.modeKey);
    const mode = TOURNAMENT_MODE_OPTIONS.find((o) => o.key === draft.modeKey);
    setModeLabel(mode?.label ?? draft.modeKey);
    setMaxEntries(draft.maxEntries);
  }, [router]);

  async function onCreate() {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || !draft.modeKey || !draft.maxEntries) {
      setError("Setup unvollständig — bitte von vorn beginnen.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createTournament({
        name: draft.name.trim(),
        modeKey: draft.modeKey,
        maxEntries: draft.maxEntries,
      });
      saveHostSession({
        tournamentId: res.tournament.id,
        inviteCode: res.tournament.inviteCode,
        hostToken: res.hostToken,
      });
      clearSetupDraft();
      router.push(`/host?code=${encodeURIComponent(res.tournament.inviteCode)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Anlegen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (!name || maxEntries == null || !modeKey) {
    return (
      <main className="t-shell">
        <p className="t-meta">Lade…</p>
      </main>
    );
  }

  return (
    <main className="t-shell">
      <p className="t-meta">{APP_NAME} · Übersicht</p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        Kurzcheck
      </h1>
      <p className="t-meta">
        Mit „Anlegen“ wird das Ereignis auf dem Server erstellt und die Lobby mit
        QR geöffnet.
      </p>

      <section className="t-card" aria-label="Zusammenfassung">
        <ul className="t-list">
          <li>
            <span>Name</span>
            <span>{name}</span>
          </li>
          <li>
            <span>Format</span>
            <span>{modeLabel}</span>
          </li>
          <li>
            <span>Max. Spieler</span>
            <span>{maxEntries}</span>
          </li>
        </ul>
      </section>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <Link href="/setup/size" className="t-btn t-btn--ghost">
          Zurück
        </Link>
        <button
          type="button"
          className="t-btn"
          disabled={busy}
          onClick={() => void onCreate()}
        >
          {busy ? "Wird angelegt…" : "Anlegen"}
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
