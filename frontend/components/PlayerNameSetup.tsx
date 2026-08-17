"use client";

import { useState } from "react";
import { deletePlayerDisplayName, putPlayerDisplayName } from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import {
  clearOwnPlayerNameLocal,
  loadOwnDisplayName,
  loadOwnNameToken,
  persistOwnPlayerName,
} from "@/lib/ownPlayerName";
import { getOrCreatePlayerId } from "@/lib/playerIdentity";

type Props = {
  onDone: () => void;
  variant?: "gate" | "settings";
};

export function PlayerNameSetup({ onDone, variant = "gate" }: Props) {
  const [name, setName] = useState(loadOwnDisplayName() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Bitte mindestens 2 Zeichen.");
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await putPlayerDisplayName(
        getOrCreatePlayerId(),
        trimmed,
        loadOwnNameToken() ?? undefined,
      );
      persistOwnPlayerName(res.displayName, res.nameToken);
      setName(res.displayName);
      setSaved(true);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const token = loadOwnNameToken();
    if (!token) {
      clearOwnPlayerNameLocal({ keepSetup: true });
      setName("");
      setSaved(false);
      onDone();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deletePlayerDisplayName(getOrCreatePlayerId(), token);
      clearOwnPlayerNameLocal({ keepSetup: true });
      setName("");
      setSaved(false);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "settings") {
    return (
      <div className="settings-name-block">
        <p className="settings-toggle-row-hint">
          Auf dem Server, an dieses Gerät gebunden. Fotos bleiben lokal.
        </p>
        <label className="player-name-label settings-name-label">
          Anzeigename
          <input
            className="glass-input mt-1 w-full min-h-9 px-3 text-sm font-semibold"
            value={name}
            maxLength={24}
            autoComplete="nickname"
            placeholder="z. B. Mara"
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
            }}
          />
        </label>
        {error && (
          <p className="glass-alert-error mt-2 px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="settings-toggle-row-hint mt-1">Gespeichert.</p>
        )}
        <div className="settings-name-actions">
          <button
            type="button"
            className="glass-button min-h-9 flex-1 px-3 text-xs font-semibold disabled:opacity-50"
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? "…" : "Speichern"}
          </button>
          {(loadOwnDisplayName() || loadOwnNameToken()) && (
            <button
              type="button"
              className="glass-button min-h-9 flex-1 px-3 text-xs font-semibold disabled:opacity-50"
              disabled={busy}
              onClick={() => void remove()}
            >
              Entfernen
            </button>
          )}
        </div>
      </div>
    );
  }

  const form = (
    <>
      <label className="player-name-label">
        Spielername
        <input
          className="glass-input mt-1 w-full"
          value={name}
          maxLength={24}
          autoComplete="nickname"
          autoFocus
          placeholder="z. B. Mara"
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
          }}
        />
      </label>
      {error && (
        <p className="glass-alert-error mt-2 px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="setup-host-submit mt-3 w-full disabled:opacity-50"
        disabled={busy}
        onClick={() => void save()}
      >
        {busy ? "Speichere …" : "Weiter"}
      </button>
    </>
  );

  return (
    <div className="player-name-gate fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="player-name-gate-card">
        <p className="app-intro-title" style={{ fontSize: "1.65rem" }}>
          {APP_NAME}
        </p>
        <h1 className="player-name-gate-heading">Wie sollen dich andere sehen?</h1>
        <p className="player-name-gate-copy">
          Einmal festlegen — der Name gehört zu diesem Gerät und erscheint in
          gemeinsamen Spielen und der Statistik. Fotos bleiben nur lokal.
        </p>
        {form}
      </div>
    </div>
  );
}
