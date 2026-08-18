"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  getTournamentByInvite,
  startTournament,
  type TournamentDto,
} from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import { TOURNAMENT_MODE_OPTIONS } from "@/lib/tournamentModes";
import { goToNewEventStart } from "@/lib/hostNav";
import { clearHostSession, loadHostSession } from "@/lib/hostStore";

function statusLabel(status?: string): string {
  if (status === "OPEN") return "Anmeldung";
  if (status === "RUNNING") return "Läuft";
  return status ?? "…";
}

function HostInner() {
  const params = useSearchParams();
  const code = (params.get("code") ?? "").trim().toUpperCase();
  const [tournament, setTournament] = useState<TournamentDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const host = loadHostSession();
  const hostToken =
    host && host.inviteCode === code ? host.hostToken : undefined;
  const isOpen = tournament?.status === "OPEN";
  const entryCount = tournament?.entryCount ?? 0;
  const maxEntries = tournament?.maxEntries;

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
        width: 420,
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
    window.location.assign("/");
  }

  const modeLabel =
    TOURNAMENT_MODE_OPTIONS.find((option) => option.key === tournament?.modeKey)
      ?.label ?? tournament?.modeKey;

  return (
    <main className="t-shell t-shell--cockpit">
      <header className="t-cockpit-head">
        <p className="t-meta">
          {APP_NAME}
          {modeLabel ? ` · ${modeLabel}` : ""}
        </p>
        <h1 className="t-brand">
          {tournament?.name?.trim() || "Ereignis-Lobby"}
        </h1>
        <p className="t-meta">
          {statusLabel(tournament?.status)}
          {" · "}
          {entryCount}
          {maxEntries != null ? ` / ${maxEntries}` : ""} Spieler
        </p>
      </header>

      <div className="t-cockpit-grid">
        <section className="t-card t-panel" aria-label="Beitritt">
          <p className="t-label">Beitritt</p>
          <div className="t-panel-body t-panel-join">
            <p className="t-code">{code || "—"}</p>
            {isOpen && qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="t-qr"
                src={qrDataUrl}
                alt={`QR für Ereignis ${code}`}
              />
            ) : null}
            <p className="t-meta">
              {isOpen
                ? "Teilnehmer scannen in der DiceBudget-App."
                : "Anmeldung geschlossen."}
            </p>
          </div>
        </section>

        <section className="t-card t-panel" aria-label="Feld">
          <p className="t-label">
            Feld · {entryCount}
            {maxEntries != null ? ` / ${maxEntries}` : ""}
          </p>
          <div className="t-panel-body">
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
                Noch keine Anmeldungen. QR zeigen, dann „Aktualisieren“.
              </p>
            )}
          </div>
        </section>

        <section className="t-card t-panel" aria-label="Leitung">
          <p className="t-label">Leitung</p>
          <div className="t-panel-body">
            <p className="t-status">{statusLabel(tournament?.status)}</p>
            <p className="t-meta">
              {isOpen
                ? "Wenn das Feld steht: Ereignis starten. Danach keine neuen Anmeldungen."
                : "Spielplan und Auslosung kommen als nächster Schritt in diesem Screen."}
            </p>
            {error && (
              <p className="t-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="t-panel-actions">
            <button
              type="button"
              className="t-btn t-btn--ghost"
              onClick={() => void refresh()}
            >
              Aktualisieren
            </button>
            <button
              type="button"
              className="t-btn t-btn--accent"
              disabled={busy || !hostToken || !isOpen}
              onClick={() => void onStart()}
            >
              {isOpen ? "Ereignis starten" : "Gestartet"}
            </button>
            <button
              type="button"
              className="t-btn t-btn--ghost"
              onClick={() => goToNewEventStart()}
            >
              Neues Event
            </button>
            <button type="button" className="t-btn t-btn--ghost" onClick={onLeave}>
              Host-Sitzung löschen
            </button>
          </div>
        </section>
      </div>
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
