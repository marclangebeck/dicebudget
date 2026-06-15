"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { LabsUnlockDialog } from "@/components/LabsUnlockDialog";
import { parseSettingsReturn } from "@/lib/settingsReturn";
import { BonusCelebrationToggle } from "@/components/BonusCelebrationToggle";
import { StrategyModeToggle } from "@/components/StrategyModeToggle";
import { isLabsUnlocked, subscribeLabsAccess } from "@/lib/labsAccess";
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
        className="app-toggle relative h-8 w-14 shrink-0 rounded-full border-2 transition"
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
    <label
      className={`settings-compact-card settings-compact-card--range${disabled ? " settings-compact-card--disabled" : ""}`}
    >
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

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-group">
      <h2 className="settings-group-title">{title}</h2>
      <div className="settings-card-grid">{children}</div>
    </section>
  );
}

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const returnTarget = parseSettingsReturn(fromParam);
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [labsUnlocked, setLabsUnlocked] = useState(false);
  const [showLabsUnlock, setShowLabsUnlock] = useState(false);

  useEffect(() => {
    setSettingsState(getAppSettings());
  }, []);

  useEffect(() => {
    setLabsUnlocked(isLabsUnlocked());
    return subscribeLabsAccess(() => setLabsUnlocked(isLabsUnlocked()));
  }, []);

  const labsHref =
    fromParam === "solo" || fromParam === "multi"
      ? `/settings/labs?from=${fromParam}`
      : "/settings/labs";

  function update(update: Partial<AppSettings>) {
    setSettingsState((current) => {
      const next = setAppSettings({ ...current, ...update });
      return next;
    });
  }

  const tableModeActive = settings.tableModeEnabled;

  return (
    <div className="settings-screen">
      <AppScreenHeader
        section="Einstellungen"
        title="App-Einstellungen"
        subtitle="Lege die Standardwerte für Solo, Multiplayer und Tischmodus fest."
        backHref={returnTarget?.href}
        backLabel={returnTarget ? `Zurück zu ${returnTarget.label}` : undefined}
      />

      <SettingsSection title="Allgemein">
        <div className="settings-compact-card settings-compact-card--toggle">
          <StrategyModeToggle
            useStrategyRules={settings.useStrategyRules}
            onChange={(value) => update({ useStrategyRules: value })}
            variant="setup"
          />
        </div>
        <div className="settings-compact-card settings-compact-card--toggle">
          <BonusCelebrationToggle
            feedbackHref={
              fromParam === "solo" || fromParam === "multi"
                ? `/settings/feedback?from=${fromParam}`
                : "/settings/feedback"
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Solo">
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
      </SettingsSection>

      <SettingsSection title="Multi">
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
      </SettingsSection>

      <SettingsSection title="iPad">
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
        <div
          className={`settings-compact-card settings-compact-card--wide${tableModeActive ? "" : " settings-compact-card--disabled"}`}
        >
          <p className="settings-compact-kicker">Tischmodus</p>
          <p className="settings-compact-title">Spielernamen</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="setup-slider-label text-left">Spieler links</span>
              <input
                type="text"
                value={settings.tableLeftName}
                maxLength={24}
                disabled={!tableModeActive}
                onChange={(e) => update({ tableLeftName: e.target.value })}
                className="glass-input min-h-10 px-3 text-sm font-semibold disabled:opacity-45"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="setup-slider-label text-left">Spieler rechts</span>
              <input
                type="text"
                value={settings.tableRightName}
                maxLength={24}
                disabled={!tableModeActive}
                onChange={(e) => update({ tableRightName: e.target.value })}
                className="glass-input min-h-10 px-3 text-sm font-semibold disabled:opacity-45"
              />
            </label>
          </div>
          <p className="settings-compact-text mt-2">
            {tableModeActive
              ? "Lokale Aliase für Anzeige und Statistik."
              : "Aktiviere iPad-Tisch, um Namen festzulegen."}
          </p>
        </div>
      </SettingsSection>

      <section className="settings-group mt-2 border-t border-white/5 pt-4">
        <h2 className="settings-group-title text-slate-500">Entwickler</h2>
        <div className="settings-card-grid">
          {labsUnlocked ? (
            <Link
              href={labsHref}
              className="settings-compact-card settings-compact-card--wide transition hover:border-emerald-400/30"
            >
              <p className="settings-compact-title">Entwickler-Vorschau</p>
              <p className="settings-compact-text mt-2">
                Experimentelle Features ein- und ausschalten.
              </p>
            </Link>
          ) : (
            <div className="settings-compact-card settings-compact-card--wide">
              <p className="settings-compact-title">Entwickler-Vorschau</p>
              <p className="settings-compact-text mt-2">
                Mit persönlichem Code neue Features vor dem Rollout testen.
              </p>
              <button
                type="button"
                onClick={() => setShowLabsUnlock(true)}
                className="glass-button mt-4 min-h-11 w-full px-4 text-sm font-semibold"
              >
                Code eingeben
              </button>
            </div>
          )}
        </div>
      </section>

      <LabsUnlockDialog
        open={showLabsUnlock}
        onClose={() => setShowLabsUnlock(false)}
        onUnlocked={() => setLabsUnlocked(true)}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}
