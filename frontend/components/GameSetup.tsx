"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveActiveGame } from "@/lib/activeGame";
import { createLocalSoloRun } from "@/lib/localSoloRun";
import { settingsHrefWithReturn } from "@/lib/settingsReturn";
import { DEFAULT_APP_SETTINGS, getAppSettings, type AppSettings } from "@/lib/uiPrefs";

export function GameSetup() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(getAppSettings());
  }, []);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const run = createLocalSoloRun(settings.soloGameCount, settings.useStrategyRules);
      saveActiveGame({ type: "solo", runId: run.id });
      router.push(`/play?runId=${run.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Start fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleStart();
      }}
      className="setup-host-form"
    >
      <section className="setup-host-success">
        <p className="text-strong text-center text-sm font-semibold">Solo bereit</p>
        <div className="settings-summary-grid">
          <span>
            <strong>{settings.soloGameCount}</strong>
            Spiele
          </span>
          <span>
            <strong>{settings.useStrategyRules ? "Strategy" : "Klassisch"}</strong>
            Modus
          </span>
        </div>
        <p className="setup-host-success-hint">
          Standardwerte aenderst du zentral in den App-Einstellungen.
        </p>
        <Link href={settingsHrefWithReturn("solo")} className="settings-inline-link">
          Einstellungen öffnen
        </Link>
      </section>

      {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="setup-host-submit setup-host-submit--sky w-full disabled:opacity-50"
      >
        {loading ? "Starte …" : "Neues Spiel starten"}
      </button>
    </form>
  );
}
