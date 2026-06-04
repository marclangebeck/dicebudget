"use client";

import { useEffect, useState, type ReactNode } from "react";
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
    <div className="settings-compact-card settings-compact-card--toggle">
      <div className="min-w-0">
        <p className="settings-compact-title">{title}</p>
        <p className="settings-compact-text">{description}</p>
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
  );
}

function RangeSettingCard({
  kicker,
  title,
  value,
  hint,
  min,
  max,
  disabled,
  onChange,
}: {
  kicker: string;
  title: string;
  value: number;
  hint: ReactNode;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="settings-compact-card settings-compact-card--range">
      <span className="settings-compact-kicker">{kicker}</span>
      <span className="settings-compact-title">{title}</span>
      <span className="settings-compact-value tabular-nums">{value}</span>
      <span className="settings-compact-text">{hint}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="setup-host-range"
      />
    </label>
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
    <div className="settings-screen">
      <AppScreenHeader
        section="Einstellungen"
        title="App-Einstellungen"
        subtitle="Lege die Standardwerte für Solo, Multiplayer und Tischmodus fest."
      />

      <section className="settings-card-grid">
        <div className="settings-compact-card settings-compact-card--toggle">
          <StrategyModeToggle
            useStrategyRules={settings.useStrategyRules}
            onChange={(value) => update({ useStrategyRules: value })}
            variant="setup"
          />
        </div>
        <div className="settings-compact-card settings-compact-card--toggle">
          <BonusCelebrationToggle />
        </div>
        <RangeSettingCard
          kicker="Einzelspiel"
          title="Solo-Spiele"
          value={settings.soloGameCount}
          hint={
            <>
              {settings.soloGameCount === 1 ? "Spiel" : "Spiele"} ·{" "}
              {settings.soloGameCount * 13} Felder
            </>
          }
          min={1}
          max={6}
          onChange={(value) => update({ soloGameCount: value })}
        />
        <RangeSettingCard
          kicker="Multiplayer"
          title="Raum-Spiele"
          value={settings.multiplayerGameCount}
          hint={
            settings.useStrategyRules
              ? `max. ${settings.multiplayerGameCount * 39} Würfe`
              : settings.multiplayerGameCount === 1
                ? "Spiel"
                : "Spiele"
          }
          min={1}
          max={6}
          onChange={(value) => update({ multiplayerGameCount: value })}
        />
        <RangeSettingCard
          kicker="Multiplayer"
          title="Mitspieler"
          value={settings.tableModeEnabled ? 2 : settings.multiplayerMaxPlayers}
          hint={settings.tableModeEnabled ? "Tischmodus: 2 Spieler" : "2-6 Spieler"}
          min={2}
          max={6}
          disabled={settings.tableModeEnabled}
          onChange={(value) => update({ multiplayerMaxPlayers: value })}
        />
        {settings.useStrategyRules && (
          <>
            <SettingsSwitch
              checked={settings.showOpponentPool}
              onChange={(value) => update({ showOpponentPool: value })}
              title="Gegner-Pool"
              description="Pool des Gegners im Spiel anzeigen."
            />
            <SettingsSwitch
              checked={settings.poolEndgameEnabled}
              onChange={(value) => update({ poolEndgameEnabled: value })}
              title="Pool-Endspiel"
              description="Pool-Sieger darf ein Feld verbessern."
            />
          </>
        )}
        <SettingsSwitch
          checked={settings.tableModeEnabled}
          onChange={(value) =>
            update({
              tableModeEnabled: value,
              multiplayerMaxPlayers: value ? 2 : settings.multiplayerMaxPlayers,
            })
          }
          title="iPad-Tisch"
          description="2-Spieler-Spiel auf einem iPad."
        />
        <div className="settings-compact-card settings-compact-card--wide">
          <p className="settings-compact-kicker">Tischmodus</p>
          <p className="settings-compact-title">Spielernamen</p>
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
          <p className="settings-compact-text mt-2">
            Lokale Aliase für Anzeige und Statistik.
          </p>
        </div>
      </section>
    </div>
  );
}
