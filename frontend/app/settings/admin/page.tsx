"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AdminUnlockDialog } from "@/components/AdminUnlockDialog";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import {
  clearStoredAdminApiKey,
  getStoredAdminApiKey,
  hasStoredOrEnvAdminApiKey,
  isAdminPinConfigured,
  isAdminUnlocked,
  lockAdmin,
  setStoredAdminApiKey,
  subscribeAdminAccess,
} from "@/lib/adminAccess";
import { hasAdminApiKey } from "@/lib/api";

export default function AdminSettingsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [adminReady, setAdminReady] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function refresh() {
    setUnlocked(isAdminUnlocked());
    setHasKey(hasStoredOrEnvAdminApiKey());
    setAdminReady(hasAdminApiKey());
    setKeyDraft(getStoredAdminApiKey());
  }

  useEffect(() => {
    refresh();
    return subscribeAdminAccess(refresh);
  }, []);

  function handleSaveKey(event: FormEvent) {
    event.preventDefault();
    setStoredAdminApiKey(keyDraft);
    setStatus("Admin-Key gespeichert (nur dieses Gerät).");
    refresh();
  }

  function handleClearKey() {
    clearStoredAdminApiKey();
    setKeyDraft("");
    setStatus("Lokal hinterlegter Key entfernt.");
    refresh();
  }

  function handleLock() {
    lockAdmin();
    setStatus("Admin gesperrt.");
    refresh();
  }

  const pinConfigured = isAdminPinConfigured();

  return (
    <div className="settings-screen">
      <AppScreenHeader
        section="Admin"
        title="Admin"
        subtitle="PIN-Freischaltung und API-Key lokal — ein App-Build."
        backHref="/settings"
        backLabel="Zurück zu Einstellungen"
      />

      <div className="flex flex-col gap-3 px-1">
        {!pinConfigured ? (
          <div className="settings-compact-card settings-compact-card--wide">
            <p className="settings-compact-title">PIN nicht konfiguriert</p>
            <p className="settings-compact-text">
              Setze <code className="text-[0.75rem]">NEXT_PUBLIC_ADMIN_PIN</code> beim Build, dann
              hier freischalten.
            </p>
          </div>
        ) : !unlocked ? (
          <div className="settings-compact-card settings-compact-card--wide">
            <p className="settings-compact-title">Admin gesperrt</p>
            <p className="settings-compact-text">
              Nach der PIN kannst du den Server-Admin-Key lokal hinterlegen. Stats-Admin (Siege/Diff,
              Server-Löschen) erscheint dann in der Statistik.
            </p>
            <button
              type="button"
              className="glass-button glass-button--primary mt-3 min-h-11 w-full px-4 text-sm font-semibold"
              onClick={() => setShowUnlock(true)}
            >
              PIN eingeben
            </button>
          </div>
        ) : (
          <>
            <div className="settings-compact-card settings-compact-card--wide">
              <p className="settings-compact-title">Status</p>
              <p className="settings-compact-text">
                Freigeschaltet
                {adminReady
                  ? " · Server-Aktionen bereit"
                  : hasKey
                    ? " · Key vorhanden, aber nicht aktiv"
                    : " · noch kein API-Key"}
              </p>
              <button
                type="button"
                className="glass-button mt-3 min-h-10 w-full px-4 text-sm font-semibold"
                onClick={handleLock}
              >
                Admin sperren
              </button>
            </div>

            <form
              onSubmit={handleSaveKey}
              className="settings-compact-card settings-compact-card--wide space-y-3"
            >
              <p className="settings-compact-title">Admin-API-Key</p>
              <p className="settings-compact-text">
                Entspricht dem Server-<code className="text-[0.75rem]">ADMIN_API_KEY</code>. Wird nur
                lokal gespeichert, nicht hochgeladen außer als Request-Header bei Admin-Aktionen.
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-400">Key</span>
                <input
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={keyDraft}
                  onChange={(e) => {
                    setKeyDraft(e.target.value);
                    setStatus(null);
                  }}
                  className="glass-input min-h-11 w-full px-3 text-sm font-semibold"
                  placeholder="Admin-API-Key"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="glass-button glass-button--primary min-h-10 flex-1 px-4 text-sm font-semibold"
                >
                  Key speichern
                </button>
                <button
                  type="button"
                  className="glass-button min-h-10 flex-1 px-4 text-sm font-semibold"
                  onClick={handleClearKey}
                >
                  Key löschen
                </button>
              </div>
            </form>

            <div className="settings-compact-card settings-compact-card--wide">
              <p className="settings-compact-title">Statistik-Admin</p>
              <p className="settings-compact-text">
                Siege/Diff und Server-Löschen unter Statistik → Verwalten
                {adminReady ? " (jetzt verfügbar)." : " (nach gültigem Key)."}
              </p>
              <Link
                href="/stats"
                className="glass-button mt-3 inline-flex min-h-10 w-full items-center justify-center px-4 text-sm font-semibold no-underline"
              >
                Zur Statistik
              </Link>
            </div>

            <div className="settings-compact-card settings-compact-card--wide opacity-90">
              <p className="settings-compact-title">Weitere Config</p>
              <p className="settings-compact-text">
                Optionale Remote-/Store-Schalter — folgt. Strategy und Hausregeln sind Teil der App
                (kein Kern-IAP).
              </p>
            </div>

            <div className="settings-compact-card settings-compact-card--wide opacity-90">
              <p className="settings-compact-title">Remote-Config</p>
              <p className="settings-compact-text">
                Feature-Flags / spätere Einstellungen — folgt.
              </p>
            </div>
          </>
        )}

        {status ? (
          <p className="px-1 text-sm font-medium text-emerald-300/90" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <AdminUnlockDialog
        open={showUnlock}
        onClose={() => setShowUnlock(false)}
        onUnlocked={() => {
          refresh();
          setStatus("Admin freigeschaltet.");
        }}
      />
    </div>
  );
}
