"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/branding";
import { loadSetupDraft } from "@/lib/setupDraft";
import { TOURNAMENT_MODE_OPTIONS } from "@/lib/tournamentModes";

export default function SetupSizePlaceholderPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [modeLabel, setModeLabel] = useState("");

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || !draft.modeKey) {
      router.replace(draft?.name.trim() ? "/setup" : "/");
      return;
    }
    setName(draft.name.trim());
    const mode = TOURNAMENT_MODE_OPTIONS.find((o) => o.key === draft.modeKey);
    setModeLabel(mode?.label ?? draft.modeKey);
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
      <p className="t-meta">{APP_NAME} · Schritt 2</p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        Größe
      </h1>
      <p className="t-meta">
        {name} · {modeLabel}
      </p>

      <section className="t-card" aria-label="Größe folgt">
        <p className="t-meta" style={{ margin: 0 }}>
          Hier wählst du als Nächstes die maximale Spielerzahl. Noch nicht
          implementiert — weiter im nächsten Entwicklungsschritt.
        </p>
      </section>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <Link href="/setup" className="t-btn t-btn--ghost">
          Zurück
        </Link>
        <button type="button" className="t-btn" disabled>
          Weiter (folgt)
        </button>
      </div>
    </main>
  );
}
