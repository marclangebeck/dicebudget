"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { HouseRuleInfoOverlay } from "@/components/HouseRuleInfoOverlay";
import { LabsUnlockDialog } from "@/components/LabsUnlockDialog";
import { PlayerNameSetup } from "@/components/PlayerNameSetup";
import { SettingsGameActions } from "@/components/settings/SettingsGameActions";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsSegmented } from "@/components/settings/SettingsSegmented";
import { SettingsStepperRow } from "@/components/settings/SettingsStepperRow";
import { SettingsToggleRow } from "@/components/settings/SettingsToggleRow";
import { getHouseRuleInfo, type HouseRuleInfo } from "@/lib/houseRuleInfo";
import { getVisualFeedbackInfo } from "@/lib/visualFeedbackInfo";
import {
  FEATURE_FLAGS_CHANGED_EVENT,
  isFeatureEnabled,
  listLabsFeatures,
  listLabsChildFeatures,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const returnTarget = parseSettingsReturn(fromParam);
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [feedbackPrefs, setFeedbackPrefsState] = useState<GameFeedbackPrefs>(
    DEFAULT_GAME_FEEDBACK_PREFS,
  );
  const [labsUnlocked, setLabsUnlocked] = useState(false);
  const [showLabsUnlock, setShowLabsUnlock] = useState(false);
  const [ruleInfo, setRuleInfo] = useState<Pick<HouseRuleInfo, "title" | "body"> | null>(
    null,
  );
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
        title="Spiel & Feedback"
        subtitle="Kurz einstellen — starten unten."
        backHref={returnTarget?.href}
        backLabel={returnTarget ? `Zurück zu ${returnTarget.label}` : undefined}
      />

      <div className="settings-list">
        <SettingsGroup title="Modus">
          <div className="settings-group-pad">
            <SettingsSegmented
              ariaLabel="Spielmodus"
              value={settings.useStrategyRules ? "strategy" : "classic"}
              onChange={(value) =>
                updateSettings({ useStrategyRules: value === "strategy" })
              }
              options={[
                { value: "classic", label: "Klassisch" },
                { value: "strategy", label: "Strategy" },
              ]}
            />
            <p className="settings-group-caption">
              {settings.useStrategyRules
                ? "Wurf-Pool und begrenzte Gesamtwürfe."
                : "Ohne Pool — nur Punkte eintragen."}
            </p>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Spieler">
          <PlayerNameSetup variant="settings" onDone={() => undefined} />
        </SettingsGroup>

        <SettingsGroup title="Feedback">
          <SettingsToggleRow
            title="Erfolgsanimationen"
            hint="Bonus, Straße, Alle Fünfe"
            checked={feedbackPrefs.animationsEnabled}
            onChange={(value) => updateFeedback({ animationsEnabled: value })}
            onInfo={() => setRuleInfo(getVisualFeedbackInfo("animations"))}
          />
          <SettingsToggleRow
            title="Gold-Aufleuchten"
            hint="Zeile/Spalte + Fanfare"
            checked={feedbackPrefs.sheetFuseHighlightEnabled}
            onChange={(value) => updateFeedback({ sheetFuseHighlightEnabled: value })}
            onInfo={() => setRuleInfo(getVisualFeedbackInfo("sheetFuse"))}
          />
          <SettingsToggleRow
            title="Sounds"
            checked={feedbackPrefs.soundsEnabled}
            onChange={(value) => updateFeedback({ soundsEnabled: value })}
            onInfo={() => setRuleInfo(getVisualFeedbackInfo("sounds"))}
          />
          <SettingsToggleRow
            title="Fortschritt"
            hint="25 / 50 / 75 %"
            checked={feedbackPrefs.progressHintsEnabled}
            onChange={(value) => updateFeedback({ progressHintsEnabled: value })}
            onInfo={() => setRuleInfo(getVisualFeedbackInfo("progress"))}
          />
          <SettingsToggleRow
            title="Heller Spielzettel"
            hint="Nur der Zettel hell"
            checked={settings.scoreSheetTheme === "light"}
            onChange={(value) =>
              updateSettings({ scoreSheetTheme: value ? "light" : "dark" })
            }
          />
        </SettingsGroup>

        <SettingsGroup title="Solo">
          <SettingsStepperRow
            title="Spiele"
            hint={`${settings.soloGameCount * 13} Felder`}
            value={settings.soloGameCount}
            min={1}
            max={6}
            onChange={(value) => updateSettings({ soloGameCount: value })}
          />
        </SettingsGroup>

        <SettingsGroup title="Multi">
          <SettingsStepperRow
            title="Spiele"
            hint={
              settings.useStrategyRules
                ? `max. ${settings.multiplayerGameCount * 39} Würfe`
                : undefined
            }
            value={settings.multiplayerGameCount}
            min={1}
            max={6}
            onChange={(value) => updateSettings({ multiplayerGameCount: value })}
          />
          <SettingsStepperRow
            title="Mitspieler"
            hint={tableModeActive ? "Tischmodus: fest 2" : "2–6 im Raum"}
            value={tableModeActive ? 2 : settings.multiplayerMaxPlayers}
            min={2}
            max={6}
            disabled={tableModeActive}
            onChange={(value) => updateSettings({ multiplayerMaxPlayers: value })}
          />
          {settings.useStrategyRules && (
            <>
              <SettingsToggleRow
                title="Gegner-Pool"
                hint="Pool und offene Felder oben im Spiel anzeigen"
                checked={settings.showOpponentPool}
                onChange={(value) => updateSettings({ showOpponentPool: value })}
              />
              <SettingsToggleRow
                title="Pool-Endspiel"
                hint="Pool-Sieger verbessert ein Feld"
                checked={settings.poolEndgameEnabled}
                onChange={(value) => updateSettings({ poolEndgameEnabled: value })}
              />
            </>
          )}
        </SettingsGroup>

        <SettingsGroup title="iPad-Tisch">
          <SettingsToggleRow
            title="Zwei Spieler auf einem iPad"
            hint="Geteilter Bildschirm"
            checked={settings.tableModeEnabled}
            onChange={(value) =>
              updateSettings({
                tableModeEnabled: value,
                multiplayerMaxPlayers: value ? 2 : settings.multiplayerMaxPlayers,
              })
            }
          />
          <div
            className={`settings-group-pad settings-table-names${
              tableModeActive ? "" : " settings-table-names--disabled"
            }`}
          >
            <div className="grid grid-cols-2 gap-2">
              <label className="flex min-w-0 flex-col gap-1">
                <span className="settings-toggle-row-hint">Links</span>
                <input
                  type="text"
                  value={settings.tableLeftName}
                  maxLength={24}
                  disabled={!tableModeActive}
                  placeholder="Name"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateSettings({ tableLeftName: e.target.value })}
                  className="glass-input min-h-9 px-3 text-sm font-semibold disabled:opacity-45"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1">
                <span className="settings-toggle-row-hint">Rechts</span>
                <input
                  type="text"
                  value={settings.tableRightName}
                  maxLength={24}
                  disabled={!tableModeActive}
                  placeholder="Name"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateSettings({ tableRightName: e.target.value })}
                  className="glass-input min-h-9 px-3 text-sm font-semibold disabled:opacity-45"
                />
              </label>
            </div>
          </div>
        </SettingsGroup>

        <SettingsGroup title="InApp-Features" variant="labs">
          {!labsUnlocked ? (
            <div className="settings-group-pad">
              <p className="settings-toggle-row-hint">
                Code eingeben, um Brennt, Verkauf, Alle Fünfe und mehr zu testen.
              </p>
              <button
                type="button"
                onClick={() => setShowLabsUnlock(true)}
                className="glass-button mt-2 min-h-10 w-full px-4 text-sm font-semibold"
              >
                Code eingeben
              </button>
            </div>
          ) : (
            <>
              {labsFeatures.map((feature) => (
                <div key={feature.id} className="settings-labs-feature-group">
                  <SettingsToggleRow
                    title={feature.title}
                    hint={feature.description}
                    checked={isFeatureEnabled(feature.id)}
                    onChange={(value) => setLabsFeaturePref(feature.id, value)}
                    onInfo={
                      feature.infoKey
                        ? () => {
                            const info = getHouseRuleInfo(feature.infoKey);
                            if (info) setRuleInfo(info);
                          }
                        : undefined
                    }
                  />
                  {isFeatureEnabled(feature.id) &&
                    listLabsChildFeatures(feature.id).map((child) => (
                      <SettingsToggleRow
                        key={child.id}
                        title={child.title}
                        hint={child.description}
                        checked={isFeatureEnabled(child.id)}
                        onChange={(value) => setLabsFeaturePref(child.id, value)}
                        nested
                        onInfo={
                          child.infoKey
                            ? () => {
                                const info = getHouseRuleInfo(child.infoKey);
                                if (info) setRuleInfo(info);
                              }
                            : undefined
                        }
                      />
                    ))}
                </div>
              ))}
              <div className="settings-group-pad">
                <button
                  type="button"
                  onClick={() => lockLabs()}
                  className="glass-button min-h-9 w-full px-4 text-xs font-semibold"
                >
                  Vorschau sperren
                </button>
              </div>
            </>
          )}
        </SettingsGroup>

        <SettingsGroup title="Admin">
          <div className="settings-group-pad">
            <p className="settings-toggle-row-hint">
              PIN und lokaler API-Key für Stats-Admin.
            </p>
            <button
              type="button"
              className="glass-button mt-2 min-h-10 w-full px-4 text-sm font-semibold"
              onClick={() => router.push("/settings/admin")}
            >
              Admin öffnen
            </button>
          </div>
        </SettingsGroup>
      </div>

      <SettingsGameActions settings={settings} />

      <LabsUnlockDialog
        open={showLabsUnlock}
        onClose={() => setShowLabsUnlock(false)}
        onUnlocked={() => setLabsUnlocked(true)}
      />
      <HouseRuleInfoOverlay info={ruleInfo} onClose={() => setRuleInfo(null)} />
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
