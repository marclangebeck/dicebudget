"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { LabsUnlockDialog } from "@/components/LabsUnlockDialog";
import { SettingsGameActions } from "@/components/settings/SettingsGameActions";
import { SettingsRangeCard } from "@/components/settings/SettingsRangeCard";
import { SettingsToggleCard } from "@/components/settings/SettingsToggleCard";
import { MODE_CLASSIC_LABEL, MODE_STRATEGY_LABEL } from "@/lib/branding";
import {
  FEATURE_FLAGS_CHANGED_EVENT,
  isFeatureEnabled,
  listLabsFeatures,
  setLabsFeaturePref,
} from "@/lib/featureFlags";
import {
  DEFAULT_GAME_FEEDBACK_PREFS,
  getGameFeedbackPrefs,
  setGameFeedbackPrefs,
  type GameFeedbackPrefs,
} from "@/lib/gameFeedbackPrefs";
import { isLabsUnlocked, lockLabs, subscribeLabsAccess } from "@/lib/labsAccess";
import { parseSettingsReturn } from "@/lib/settingsReturn";
import {
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  setAppSettings,
  type AppSettings,
} from "@/lib/uiPrefs";

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const returnTarget = parseSettingsReturn(fromParam);
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [feedbackPrefs, setFeedbackPrefsState] = useState<GameFeedbackPrefs>(
    DEFAULT_GAME_FEEDBACK_PREFS,
  );
  const [labsUnlocked, setLabsUnlocked] = useState(false);
  const [showLabsUnlock, setShowLabsUnlock] = useState(false);
  const [featureRevision, setFeatureRevision] = useState(0);

  useEffect(() => {
    setSettingsState(getAppSettings());
    setFeedbackPrefsState(getGameFeedbackPrefs());
  }, []);

  useEffect(() => {
    setLabsUnlocked(isLabsUnlocked());
    return subscribeLabsAccess(() => setLabsUnlocked(isLabsUnlocked()));
  }, []);

  useEffect(() => {
    function bump() {
      setFeatureRevision((value) => value + 1);
    }
    window.addEventListener(FEATURE_FLAGS_CHANGED_EVENT, bump);
    return () => window.removeEventListener(FEATURE_FLAGS_CHANGED_EVENT, bump);
  }, []);

  function updateSettings(update: Partial<AppSettings>) {
    setSettingsState((current) => setAppSettings({ ...current, ...update }));
  }

  function updateFeedback(update: Partial<GameFeedbackPrefs>) {
    setFeedbackPrefsState((current) => setGameFeedbackPrefs({ ...current, ...update }));
  }

  const tableModeActive = settings.tableModeEnabled;
  const labsFeatures = listLabsFeatures();
  void featureRevision;

  return (
    <div className="settings-screen">
      <AppScreenHeader
        section="Einstellungen"
        title="Alles auf einen Blick"
        subtitle="Toggles, Hausregeln und Spielstart — ohne Unterseiten."
        backHref={returnTarget?.href}
        backLabel={returnTarget ? `Zurück zu ${returnTarget.label}` : undefined}
      />

      <div className="settings-list">
        <p className="settings-section-label">Spielmodus</p>
        <SettingsToggleCard
          title={settings.useStrategyRules ? MODE_STRATEGY_LABEL : MODE_CLASSIC_LABEL}
          description={
            settings.useStrategyRules
              ? "Wurf-Pool und begrenzte Gesamtwürfe über alle Felder."
              : "Ohne Pool — nur Punkte eintragen."
          }
          checked={settings.useStrategyRules}
          onChange={(value) => updateSettings({ useStrategyRules: value })}
        />

        <p className="settings-section-label">Spiel-Feedback</p>
        <SettingsToggleCard
          title="Erfolgsanimationen"
          description="Overlays bei Bonus, unterer Spalte, Große Straße und Alle Fünfe."
          checked={feedbackPrefs.animationsEnabled}
          onChange={(value) => updateFeedback({ animationsEnabled: value })}
        />
        <SettingsToggleCard
          title="Sounds"
          description="Akustische Hinweise bei Erfolgen und Fortschritts-Meilensteinen."
          checked={feedbackPrefs.soundsEnabled}
          onChange={(value) => updateFeedback({ soundsEnabled: value })}
        />
        <SettingsToggleCard
          title="Fortschritt (25 / 50 / 75 %)"
          description="Kurzer Hinweis, wenn ein Viertel der Würfe absolviert ist."
          checked={feedbackPrefs.progressHintsEnabled}
          onChange={(value) => updateFeedback({ progressHintsEnabled: value })}
        />

        <p className="settings-section-label">Solo</p>
        <SettingsRangeCard
          title="Anzahl Spiele"
          value={settings.soloGameCount}
          hint={
            <>
              {settings.soloGameCount === 1 ? "Spiel" : "Spiele"} ·{" "}
              {settings.soloGameCount * 13} Felder
            </>
          }
          min={1}
          max={6}
          onChange={(value) => updateSettings({ soloGameCount: value })}
        />

        <p className="settings-section-label">Multiplayer</p>
        <SettingsRangeCard
          title="Anzahl Spiele"
          value={settings.multiplayerGameCount}
          hint={
            settings.useStrategyRules
              ? `max. ${settings.multiplayerGameCount * 39} Würfe`
              : settings.multiplayerGameCount === 1
                ? "1 Spiel"
                : `${settings.multiplayerGameCount} Spiele`
          }
          min={1}
          max={6}
          onChange={(value) => updateSettings({ multiplayerGameCount: value })}
        />
        <SettingsRangeCard
          title="Mitspieler"
          value={settings.tableModeEnabled ? 2 : settings.multiplayerMaxPlayers}
          hint={settings.tableModeEnabled ? "Tischmodus: fest 2 Spieler" : "2–6 Spieler im Raum"}
          min={2}
          max={6}
          disabled={settings.tableModeEnabled}
          onChange={(value) => updateSettings({ multiplayerMaxPlayers: value })}
        />
        {settings.useStrategyRules && (
          <>
            <SettingsToggleCard
              title="Gegner-Pool"
              description="Pool des Gegners im Spiel anzeigen."
              checked={settings.showOpponentPool}
              onChange={(value) => updateSettings({ showOpponentPool: value })}
            />
            <SettingsToggleCard
              title="Pool-Endspiel"
              description="Pool-Sieger darf ein Feld verbessern."
              checked={settings.poolEndgameEnabled}
              onChange={(value) => updateSettings({ poolEndgameEnabled: value })}
            />
          </>
        )}

        <p className="settings-section-label">iPad-Tisch</p>
        <SettingsToggleCard
          title="Zwei Spieler auf einem iPad"
          description="Lokaler Tischmodus mit geteiltem Bildschirm."
          checked={settings.tableModeEnabled}
          onChange={(value) =>
            updateSettings({
              tableModeEnabled: value,
              multiplayerMaxPlayers: value ? 2 : settings.multiplayerMaxPlayers,
            })
          }
        />
        <div
          className={`settings-compact-card settings-compact-card--wide settings-compact-card--slim${tableModeActive ? "" : " settings-compact-card--disabled"}`}
        >
          <p className="settings-compact-title settings-compact-title--sm">Spielernamen</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="setup-slider-label text-left text-[0.62rem]">Links</span>
              <input
                type="text"
                value={settings.tableLeftName}
                maxLength={24}
                disabled={!tableModeActive}
                placeholder="Spielername"
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateSettings({ tableLeftName: e.target.value })}
                className="glass-input min-h-9 px-3 text-sm font-semibold disabled:opacity-45"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="setup-slider-label text-left text-[0.62rem]">Rechts</span>
              <input
                type="text"
                value={settings.tableRightName}
                maxLength={24}
                disabled={!tableModeActive}
                placeholder="Spielername"
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateSettings({ tableRightName: e.target.value })}
                className="glass-input min-h-9 px-3 text-sm font-semibold disabled:opacity-45"
              />
            </label>
          </div>
        </div>

        {!labsUnlocked ? (
          <>
            <p className="settings-section-label settings-section-label--labs">Hausregeln</p>
            <div className="settings-compact-card settings-compact-card--wide settings-compact-card--slim settings-compact-card--labs">
              <p className="settings-compact-title settings-compact-title--sm">
                Entwickler-Vorschau
              </p>
              <p className="settings-compact-text settings-compact-text--sm">
                Code eingeben, um Brennt, Wurf verkaufen und 2× Alle Fünfe zu testen.
              </p>
              <button
                type="button"
                onClick={() => setShowLabsUnlock(true)}
                className="glass-button mt-2 min-h-10 w-full px-4 text-sm font-semibold"
              >
                Code eingeben
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="settings-section-label settings-section-label--labs">Hausregeln</p>
            {labsFeatures.map((feature) => (
              <SettingsToggleCard
                key={feature.id}
                title={feature.title}
                description={feature.description}
                checked={isFeatureEnabled(feature.id)}
                onChange={(value) => setLabsFeaturePref(feature.id, value)}
              />
            ))}
            <div className="settings-compact-card settings-compact-card--wide settings-compact-card--slim settings-compact-card--labs">
              <p className="settings-compact-text settings-compact-text--sm">
                Vorschau sperren entfernt den Zugang auf diesem Gerät.
              </p>
              <button
                type="button"
                onClick={() => lockLabs()}
                className="glass-button mt-2 min-h-9 w-full px-4 text-xs font-semibold"
              >
                Vorschau sperren
              </button>
            </div>
          </>
        )}
      </div>

      <SettingsGameActions settings={settings} />

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
