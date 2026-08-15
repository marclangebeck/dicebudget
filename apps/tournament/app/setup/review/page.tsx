"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/branding";
import { loadSetupDraft } from "@/lib/setupDraft";
import { TOURNAMENT_MODE_OPTIONS } from "@/lib/tournamentModes";

export default function SetupReviewPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [modeLabel, setModeLabel] = useState("");
  const [maxEntries, setMaxEntries] = useState<number | null>(null);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || !draft.modeKey || !draft.maxEntries) {
      if (!draft?.name.trim()) router.replace("/");
      else if (!draft.modeKey) router.replace("/setup");
      else router.replace("/setup/size");
      return;
    }
    setName(draft.name.trim());
    const mode = TOURNAMENT_MODE_OPTIONS.find((o) => o.key === draft.modeKey);
    setModeLabel(mode?.label ?? draft.modeKey);
    setMaxEntries(draft.maxEntries);
  }, [router]);

  if (!name || maxEntries == null) {
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
      <p className="t-meta">Noch nichts wird auf dem Server angelegt.</p>

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
        <p className="t-meta" style={{ margin: "0.85rem 0 0" }}>
          Als Nächstes: Ereignis anlegen und Lobby mit QR öffnen — im nächsten
          Entwicklungsschritt.
        </p>
      </section>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <Link href="/setup/size" className="t-btn t-btn--ghost">
          Zurück
        </Link>
        <button type="button" className="t-btn" disabled>
          Anlegen (folgt)
        </button>
      </div>
    </main>
  );
}
