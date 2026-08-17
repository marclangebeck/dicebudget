"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  getTournamentByInvite,
  startTournament,
  type TournamentDto,
} from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import { TOURNAMENT_MODE_OPTIONS } from "@/lib/tournamentModes";
import { clearHostSession, loadHostSession } from "@/lib/hostStore";

function HostInner() {
  const router = useRouter();
  const params = useSearchParams();
  const code = (params.get("code") ?? "").trim().toUpperCase();
  const [tournament, setTournament] = useState<TournamentDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const host = loadHostSession();
  const hostToken =
    host && host.inviteCode === code ? host.hostToken : undefined;

  const refresh = useCallback(async () => {
    if (!code) {
      setError("Kein Turnier-Code.");
      return;
    }
    setError(null);
    try {
      const res = await getTournamentByInvite(code, hostToken);
      setTournament(res.tournament);
      const site =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        "https://dicebudget.bottle-trade.de";
      const joinUrl = `${site}/tournament/join?code=${encodeURIComponent(code)}`;
      const dataUrl = await QRCode.toDataURL(joinUrl, {
        margin: 1,
        width: 320,
        color: { dark: "#0c1a2e", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    }
  }, [code, hostToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onStart() {
    if (!tournament || !hostToken) {
      setError("Nur der Host dieses Geräts kann das Turnier starten.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await startTournament(tournament.id, hostToken);
      setTournament(res.tournament);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Start fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  function onLeave() {
    clearHostSession();
    router.push("/");
  }

  const modeLabel =
    TOURNAMENT_MODE_OPTIONS.find((option) => option.key === tournament?.modeKey)
      ?.label ?? tournament?.modeKey;

  return (
    <main className="t-shell">
      <p className="t-meta">
        {APP_NAME} · {modeLabel ?? "Lobby"}
      </p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        {tournament?.name?.trim() || "Ereignis-Lobby"}
      </h1>
      <p className="t-code">{code || "—"}</p>

      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="t-qr" src={qrDataUrl} alt={`QR für Ereignis ${code}`} />
      )}

      <p className="t-meta">
        Teilnehmer scannen den QR in der DiceBudget-App → Event-Lobby.
      </p>

      <p className="t-meta">
        Status: <strong>{tournament?.status ?? "…"}</strong>
        {" · "}
        Spieler: {tournament?.entryCount ?? 0}
        {tournament ? ` / ${tournament.maxEntries}` : ""}
      </p>

      <section className="t-card" aria-label="Angemeldete Spieler">
        <p className="t-label" style={{ marginBottom: "0.55rem" }}>
          Angemeldet
        </p>
        {tournament?.entries && tournament.entries.length > 0 ? (
          <ul className="t-list">
            {tournament.entries.map((entry) => (
              <li key={entry.id}>
                <span>{entry.displayName}</span>
                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  #{entry.orderIndex + 1}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="t-meta" style={{ margin: 0 }}>
            Noch keine Anmeldungen — QR bereit halten und Liste per „Aktualisieren“
            prüfen.
          </p>
        )}
      </section>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <button type="button" className="t-btn t-btn--ghost" onClick={() => void refresh()}>
          Aktualisieren
        </button>
        <button
          type="button"
          className="t-btn t-btn--accent"
          disabled={busy || !hostToken || tournament?.status !== "OPEN"}
          onClick={() => void onStart()}
        >
          Ereignis starten
        </button>
        <Link href="/" className="t-btn t-btn--ghost">
          Zur Startseite
        </Link>
        <button type="button" className="t-btn t-btn--ghost" onClick={onLeave}>
          Host-Sitzung löschen
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

export default function HostPage() {
  return (
    <Suspense fallback={<main className="t-shell">Lade Host…</main>}>
      <HostInner />
    </Suspense>
  );
}
