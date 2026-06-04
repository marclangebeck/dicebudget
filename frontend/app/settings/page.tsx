"use client";

import { useEffect, useState } from "react";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { BonusCelebrationToggle } from "@/components/BonusCelebrationToggle";
import { StrategyModeToggle } from "@/components/StrategyModeToggle";
import {
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  setAppSettings,
  type AppSettings,
} from "@/lib/uiPrefs";

function SettingsSwitch({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <div className="setup-mode-toggle">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-strong text-sm font-semibold">{title}</p>
          <p className="text-muted mt-0.5 text-xs leading-snug">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={`${title} ${checked ? "deaktivieren" : "aktivieren"}`}
          onClick={() => onChange(!checked)}
          className="relative h-8 w-14 shrink-0 rounded-full border-2 transition"
        >
          <span
            className={`absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
              checked ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  useEffect(() => {
    setSettingsState(getAppSettings());
  }, []);

  function update(update: Partial<AppSettings>) {
    setSettingsState((current) => {
      const next = setAppSettings({ ...current, ...update });
      return next;
    });
  }

  return (
    <div className="settings-screen pb-2">
      <AppScreenHeader
        section="Einstellungen"
        title="App-Einstellungen"
        subtitle="Lege die Standardwerte für Solo, Multiplayer und Tischmodus fest."
      />

      <section className="setup-host-card setup-host-card--mode">
        <StrategyModeToggle
          useStrategyRules={settings.useStrategyRules}
          onChange={(value) => update({ useStrategyRules: value })}
          variant="setup"
        />
      </section>

      <section className="setup-host-card setup-host-card--mode">
        <BonusCelebrationToggle />
      </section>

      <section className="settings-section-card">
        <div>
          <p className="settings-section-kicker">Einzelspiel</p>
          <h2 className="settings-section-title">Solo-Standard</h2>
        </div>
        <label className="setup-slider-card setup-slider-card--sky setup-slider-card--wide">
          <span className="setup-slider-label">Spielanzahl</span>
          <span className="setup-slider-value tabular-nums">{settings.soloGameCount}</span>
          <span className="setup-slider-hint">
            {settings.soloGameCount === 1 ? "Spiel" : "Spiele"} ·{" "}
            {settings.soloGameCount * 13} Felder
          </span>
          <input
            type="range"
            min={1}
            max={6}
            value={settings.soloGameCount}
            onChange={(e) => update({ soloGameCount: Number(e.target.value) })}
            className="setup-host-range"
          />
        </label>
      </section>

      <section className="settings-section-card">
        <div>
          <p className="settings-section-kicker">Multiplayer</p>
          <h2 className="settings-section-title">Raum-Standard</h2>
        </div>
        <div className="setup-host-sliders">
          <label className="setup-slider-card setup-slider-card--sky">
            <span className="setup-slider-label">Spielanzahl</span>
            <span className="setup-slider-value tabular-nums">
              {settings.multiplayerGameCount}
            </span>
            <span className="setup-slider-hint">
              {settings.multiplayerGameCount === 1 ? "Spiel" : "Spiele"}
              {settings.useStrategyRules && (
                <>
                  <br />
                  max. {settings.multiplayerGameCount * 39} Würfe
                </>
              )}
            </span>
            <input
              type="range"
              min={1}
              max={6}
              value={settings.multiplayerGameCount}
              onChange={(e) => update({ multiplayerGameCount: Number(e.target.value) })}
              className="setup-host-range"
            />
          </label>

          <label className="setup-slider-card setup-slider-card--emerald">
            <span className="setup-slider-label">Mitspieler max.</span>
            <span className="setup-slider-value tabular-nums">
              {settings.tableModeEnabled ? 2 : settings.multiplayerMaxPlayers}
            </span>
            <span className="setup-slider-hint">
              {settings.tableModeEnabled ? "Tischmodus: 2 Spieler" : "2-6 Spieler"}
            </span>
            <input
              type="range"
              min={2}
              max={6}
              value={settings.tableModeEnabled ? 2 : settings.multiplayerMaxPlayers}
              disabled={settings.tableModeEnabled}
              onChange={(e) => update({ multiplayerMaxPlayers: Number(e.target.value) })}
              className="setup-host-range"
            />
          </label>
        </div>

        {settings.useStrategyRules && (
          <>
            <div className="setup-host-card setup-host-card--mode">
              <SettingsSwitch
                checked={settings.showOpponentPool}
                onChange={(value) => update({ showOpponentPool: value })}
                title="Gegner-Pool sichtbar"
                description="Zeigt im Spiel den Wurf-Pool des Gegners (nur bei genau 2 Spielern)."
              />
            </div>
            <div className="setup-host-card setup-host-card--mode">
              <SettingsSwitch
                checked={settings.poolEndgameEnabled}
                onChange={(value) => update({ poolEndgameEnabled: value })}
                title="Pool-Endspiel"
                description="Wer am Ende die meisten Würfe im Pool hat, darf ein Feld verbessern."
              />
            </div>
          </>
        )}
      </section>

      <section className="settings-section-card">
        <div>
          <p className="settings-section-kicker">iPad</p>
          <h2 className="settings-section-title">Tischmodus</h2>
        </div>
        <div className="setup-host-card setup-host-card--mode">
          <SettingsSwitch
            checked={settings.tableModeEnabled}
            onChange={(value) =>
              update({
                tableModeEnabled: value,
                multiplayerMaxPlayers: value ? 2 : settings.multiplayerMaxPlayers,
              })
            }
            title="iPad-Tischmodus"
            description="Erstellt ein 2-Spieler-Spiel für ein iPad im Querformat."
          />
        </div>

        <div className="setup-host-card setup-host-card--mode">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="setup-slider-label text-left">Spieler links</span>
              <input
                type="text"
                value={settings.tableLeftName}
                maxLength={24}
                onChange={(e) => update({ tableLeftName: e.target.value })}
                className="glass-input min-h-10 px-3 text-sm font-semibold"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="setup-slider-label text-left">Spieler rechts</span>
              <input
                type="text"
                value={settings.tableRightName}
                maxLength={24}
                onChange={(e) => update({ tableRightName: e.target.value })}
                className="glass-input min-h-10 px-3 text-sm font-semibold"
              />
            </label>
          </div>
          <p className="text-muted mt-2 text-xs leading-snug">
            Die Namen werden beim Tischspiel als lokale Aliase für Anzeige und Statistik
            verwendet.
          </p>
        </div>
      </section>
    </div>
  );
}
