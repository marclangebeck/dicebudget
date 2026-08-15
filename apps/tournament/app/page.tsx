"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTournament } from "@/lib/api";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { loadHostSession, saveHostSession } from "@/lib/hostStore";

export default function TournamentHomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [openCode, setOpenCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setHasSaved(Boolean(loadHostSession()));
  }, []);

  async function onCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await createTournament({
        name: name.trim() || undefined,
        modeKey: "league",
      });
      saveHostSession({
        tournamentId: res.tournament.id,
        inviteCode: res.tournament.inviteCode,
        hostToken: res.hostToken,
      });
      router.push(`/host?code=${encodeURIComponent(res.tournament.inviteCode)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Turnier konnte nicht erstellt werden");
    } finally {
      setBusy(false);
    }
  }

  function onOpenSaved() {
    const saved = loadHostSession();
    if (!saved) {
      setError("Kein gespeichertes Host-Turnier auf diesem Gerät.");
      return;
    }
    router.push(`/host?code=${encodeURIComponent(saved.inviteCode)}`);
  }

  function onOpenCode() {
    const code = openCode.trim().toUpperCase();
    if (code.length < 6) {
      setError("Bitte gültigen Turnier-Code eingeben (mind. 6 Zeichen).");
      return;
    }
    const saved = loadHostSession();
    if (!saved || saved.inviteCode !== code) {
      setError(
        "Zum Öffnen als Host muss dieses Gerät das Turnier erstellt haben (Host-Token).",
      );
      return;
    }
    router.push(`/host?code=${encodeURIComponent(code)}`);
  }

  return (
    <main className="t-shell">
      <h1 className="t-brand">{APP_NAME}</h1>
      <p className="t-tagline">{APP_TAGLINE}</p>

      <section className="t-card" aria-label="Turnier erstellen">
        <label className="t-label">
          Name (optional)
          <input
            className="t-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Freitagabend"
            maxLength={48}
            style={{ textTransform: "none", letterSpacing: "normal" }}
          />
        </label>
        <div className="t-stack">
          <button
            type="button"
            className="t-btn"
            disabled={busy}
            onClick={() => void onCreate()}
          >
            Turnier erstellen
          </button>
          {hasSaved && (
            <button type="button" className="t-btn t-btn--accent" onClick={onOpenSaved}>
              Letztes Turnier öffnen
            </button>
          )}
        </div>
      </section>

      <section className="t-card" style={{ marginTop: "1rem" }} aria-label="Turnier öffnen">
        <label className="t-label">
          Code öffnen (dieses Gerät = Host)
          <input
            className="t-input"
            value={openCode}
            onChange={(e) => setOpenCode(e.target.value.toUpperCase())}
            placeholder="ABCDEFGH"
            maxLength={12}
            autoCapitalize="characters"
          />
        </label>
        <button type="button" className="t-btn t-btn--ghost" onClick={onOpenCode}>
          Turnier öffnen
        </button>
      </section>

      {error && (
        <p className="t-error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
