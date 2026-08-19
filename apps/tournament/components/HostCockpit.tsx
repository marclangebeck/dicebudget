"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  getTournamentByInvite,
  startTournament,
  type TournamentDto,
} from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import { TOURNAMENT_MODE_OPTIONS } from "@/lib/tournamentModes";
import { clearHostSession, loadHostSession } from "@/lib/hostStore";

function statusLabel(status?: string): string {
  if (status === "OPEN") return "Anmeldung";
  if (status === "RUNNING") return "Läuft";
  return status ?? "…";
}

function phaseLabel(phase?: string): string {
  if (phase === "LEAGUE") return "Liga";
  if (phase === "GROUP") return "Gruppenphase";
  if (phase === "KO") return "K.O.";
  return phase ?? "Phase";
}

type Props = {
  inviteCode: string;
  onNewEvent: () => void;
  onSessionCleared: () => void;
};

export function HostCockpit({ inviteCode, onNewEvent, onSessionCleared }: Props) {
  const code = inviteCode.trim().toUpperCase();
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
  const groups = tournament?.groups ?? [];
  const rounds = tournament?.rounds ?? [];

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
        <p className="t-meta">Drei Container — Beitritt · Feld · Leitung</p>
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
                : "Spielplan ist jetzt Datenbasis für Gruppen, Tabelle und Paarungen."}
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
            <button type="button" className="t-btn t-btn--ghost" onClick={onNewEvent}>
              Neues Event
            </button>
            <button
              type="button"
              className="t-btn t-btn--ghost"
              onClick={() => {
                clearHostSession();
                onSessionCleared();
              }}
            >
              Host-Sitzung löschen
            </button>
          </div>
        </section>

        {!isOpen && (
          <section className="t-card t-panel" aria-label="Gruppen und Tabelle">
            <p className="t-label">Gruppen und Tabelle</p>
            <div className="t-panel-body">
              {groups.length > 0 ? (
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px",
                        padding: "0.8rem",
                      }}
                    >
                      <p className="t-status" style={{ marginBottom: "0.5rem" }}>
                        {group.name}
                      </p>
                      {group.standings.length > 0 ? (
                        <ul className="t-list">
                          {group.standings.map((standing) => (
                            <li key={standing.id}>
                              <span>
                                {standing.rank > 0 ? `${standing.rank}. ` : ""}
                                {standing.entry.displayName}
                              </span>
                              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                                {standing.points} P · Diff {standing.totalScoreDiff}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="t-meta" style={{ margin: 0 }}>
                          Tabelle startet nach dem ersten gewerteten Match.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="t-meta" style={{ margin: 0 }}>
                  Bei Liga wird eine Gesamttabelle, bei Turnier Gruppenübersichten angezeigt.
                </p>
              )}
            </div>
          </section>
        )}

        {!isOpen && (
          <section className="t-card t-panel" aria-label="Spielpaarungen">
            <p className="t-label">Spielpaarungen</p>
            <div className="t-panel-body">
              {rounds.length > 0 ? (
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {rounds.map((round) => (
                    <div
                      key={round.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px",
                        padding: "0.8rem",
                      }}
                    >
                      <p className="t-status" style={{ marginBottom: "0.35rem" }}>
                        {round.title}
                      </p>
                      <p className="t-meta" style={{ marginBottom: "0.5rem" }}>
                        {phaseLabel(round.phase)}
                      </p>
                      <ul className="t-list">
                        {round.matches.map((match) => (
                          <li key={match.id}>
                            <span>
                              {match.homeEntry.displayName} vs {match.awayEntry.displayName}
                            </span>
                            <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                              {match.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="t-meta" style={{ margin: 0 }}>
                  Nach dem Start werden hier Spieltage, Gruppenrunden und später K.O.-Paarungen angezeigt.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
