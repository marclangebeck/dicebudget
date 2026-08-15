"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/branding";
import { loadSetupDraft } from "@/lib/setupDraft";

export default function SetupTurnierPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [maxEntries, setMaxEntries] = useState<number | null>(null);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || draft.modeKey !== "turnier" || !draft.maxEntries) {
      if (!draft?.name.trim()) router.replace("/");
      else if (draft.modeKey === "league") router.replace("/setup/league");
      else if (!draft.modeKey) router.replace("/setup");
      else router.replace("/setup/size");
      return;
    }
    setName(draft.name.trim());
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
      <p className="t-meta">{APP_NAME} · Turnier</p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        Turnier-Einstellungen
      </h1>
      <p className="t-meta">
        {name} · max. {maxEntries} Spieler
      </p>

      <section className="t-card" aria-label="Turnier folgt">
        <p className="t-meta" style={{ margin: 0 }}>
          Hier folgen Gruppen-Vorrunde, Qualifikation und K.O.-Hauptrunde. Noch
          Platzhalter — wir bauen den Turnier-Zweig Schritt für Schritt aus.
        </p>
      </section>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <Link href="/setup/size" className="t-btn t-btn--ghost">
          Zurück
        </Link>
        <button
          type="button"
          className="t-btn"
          onClick={() => router.push("/setup/review")}
        >
          Weiter
        </button>
      </div>
    </main>
  );
}
