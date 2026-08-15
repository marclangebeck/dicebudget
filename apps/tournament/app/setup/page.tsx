"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/branding";
import { loadSetupDraft } from "@/lib/setupDraft";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim()) {
      router.replace("/");
      return;
    }
    setName(draft.name.trim());
  }, [router]);

  if (!name) {
    return (
      <main className="t-shell">
        <p className="t-meta">Lade…</p>
      </main>
    );
  }

  return (
    <main className="t-shell">
      <p className="t-meta">{APP_NAME}</p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        Turniereinstellungen
      </h1>
      <p className="t-meta">
        Turnier: <strong style={{ color: "var(--ink)" }}>{name}</strong>
      </p>

      <section className="t-card" aria-label="Nächste Schritte">
        <p className="t-label" style={{ marginBottom: "0.55rem" }}>
          Schritt 1 von mehreren
        </p>
        <p className="t-meta" style={{ margin: 0 }}>
          Als Nächstes folgen Format, Größe und weitere Voreinstellungen — Schritt für
          Schritt. Noch nichts wird auf dem Server angelegt.
        </p>
      </section>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <Link href="/" className="t-btn t-btn--ghost">
          Zurück
        </Link>
        <button type="button" className="t-btn" disabled>
          Weiter (folgt)
        </button>
      </div>
    </main>
  );
}
