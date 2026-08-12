"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { HouseRuleInfoOverlay } from "@/components/HouseRuleInfoOverlay";
import { LabsUnlockDialog } from "@/components/LabsUnlockDialog";
import { SettingsGameActions } from "@/components/settings/SettingsGameActions";
import { SettingsRangeCard } from "@/components/settings/SettingsRangeCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsToggleCard } from "@/components/settings/SettingsToggleCard";
import { getHouseRuleInfo, type HouseRuleInfo } from "@/lib/houseRuleInfo";
import { getVisualFeedbackInfo } from "@/lib/visualFeedbackInfo";
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

type SettingsSectionId =
  | "mode"
  | "visuals"
  | "solo"
  | "multi"
  | "ipad"
  | "house-rules";

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
  const [openSections, setOpenSections] = useState<Record<SettingsSectionId, boolean>>({
    mode: false,
    visuals: false,
    solo: false,
    multi: false,
    ipad: false,
    "house-rules": false,
  });

  useEffect(() => {
    setSettingsState(getAppSettings());
    setFeedbackPrefsState(getGameFeedbackPrefs());
  }, []);

  useEffect(() => {
    if (searchParams.get("open") === "rivals") {
      router.replace("/settings/rivals");
    }
  }, [router, searchParams]);

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

  function toggleSection(id: SettingsSectionId) {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  }

  const tableModeActive = settings.tableModeEnabled;
  const labsFeatures = listLabsFeatures();
  void featureRevision;

  const visualsEnabledCount = [
    feedbackPrefs.animationsEnabled,
    feedbackPrefs.sheetFuseHighlightEnabled,
    feedbackPrefs.soundsEnabled,
    feedbackPrefs.progressHintsEnabled,
  ].filter(Boolean).length;

  const houseRulesSummary = labsUnlocked
    ? `${labsFeatures.filter((feature) => isFeatureEnabled(feature.id)).length} aktiv`
    : "Code nötig";

  return (
    <div className="settings-screen">
      <AppScreenHeader
        section="Einstellungen"
        title="Alles auf einen Blick"
        subtitle="Bereiche aufklappen, anpassen, zuklappen — Spielstart unten."
        backHref={returnTarget?.href}
        backLabel={returnTarget ? `Zurück zu ${returnTarget.label}` : undefined}
      />

      <div className="settings-list">
        <SettingsSection
          id="mode"
          title="Spielmodus"
          summary={settings.useStrategyRules ? "Strategy" : "Klassisch"}
          open={openSections.mode}
          onToggle={() => toggleSection("mode")}
        >
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
        </SettingsSection>

        <SettingsSection
          id="visuals"
          title="Visuelle Einblendungen"
          summary={`${visualsEnabledCount} von 4 aktiv`}
          open={openSections.visuals}
          onToggle={() => toggleSection("visuals")}
        >
          <SettingsToggleCard
            title="Erfolgsanimationen"
            description="Overlays bei Bonus, unterer Spalte, Große Straße und Alle Fünfe."
            checked={feedbackPrefs.animationsEnabled}
            onChange={(value) => updateFeedback({ animationsEnabled: value })}
            onInfo={() => setRuleInfo(getVisualFeedbackInfo("animations"))}
          />
          <SettingsToggleCard
            title="Zeilen-/Spalten-Lauffeuer"
            description="Kurzes umlaufendes Highlight, wenn eine Feld-Zeile oder Spiel-Spalte voll ist."
            checked={feedbackPrefs.sheetFuseHighlightEnabled}
            onChange={(value) => updateFeedback({ sheetFuseHighlightEnabled: value })}
            onInfo={() => setRuleInfo(getVisualFeedbackInfo("sheetFuse"))}
          />
          <SettingsToggleCard
            title="Sounds"
            description="Akustische Hinweise bei Erfolgen und Fortschritts-Meilensteinen."
            checked={feedbackPrefs.soundsEnabled}
            onChange={(value) => updateFeedback({ soundsEnabled: value })}
            onInfo={() => setRuleInfo(getVisualFeedbackInfo("sounds"))}
          />
          <SettingsToggleCard
            title="Fortschritt (25 / 50 / 75 %)"
            description="Kurzer Hinweis, wenn ein Viertel der Würfe absolviert ist."
            checked={feedbackPrefs.progressHintsEnabled}
            onChange={(value) => updateFeedback({ progressHintsEnabled: value })}
            onInfo={() => setRuleInfo(getVisualFeedbackInfo("progress"))}
          />
        </SettingsSection>

        <SettingsSection
          id="solo"
          title="Solo"
          summary={`${settings.soloGameCount} ${settings.soloGameCount === 1 ? "Spiel" : "Spiele"}`}
          open={openSections.solo}
          onToggle={() => toggleSection("solo")}
        >
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
        </SettingsSection>

        <SettingsSection
          id="multi"
          title="Multi"
          summary={
            settings.tableModeEnabled
              ? "Tischmodus aktiv"
              : `${settings.multiplayerGameCount} Spiele · ${settings.multiplayerMaxPlayers} Spieler`
          }
          open={openSections.multi}
          onToggle={() => toggleSection("multi")}
        >
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
        </SettingsSection>

        <SettingsSection
          id="ipad"
          title="iPad-Tisch"
          summary={settings.tableModeEnabled ? "Aktiv" : "Aus"}
          open={openSections.ipad}
          onToggle={() => toggleSection("ipad")}
        >
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
        </SettingsSection>

        <SettingsSection
          id="house-rules"
          title="InApp-Käufe (Features)"
          summary={houseRulesSummary}
          variant="labs"
          open={openSections["house-rules"]}
          onToggle={() => toggleSection("house-rules")}
        >
          {!labsUnlocked ? (
            <div className="settings-compact-card settings-compact-card--wide settings-compact-card--slim settings-compact-card--labs">
              <p className="settings-compact-title settings-compact-title--sm">
                Entwickler-Vorschau
              </p>
              <p className="settings-compact-text settings-compact-text--sm">
                Code eingeben, um alle Features (Brennt, Verkauf, Alle Fünfe, Oberer Bereich) zu testen.
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
                <SettingsToggleCard
                  key={feature.id}
                  title={feature.title}
                  description={feature.description}
                  checked={isFeatureEnabled(feature.id)}
                  onChange={(value) => setLabsFeaturePref(feature.id, value)}
                  onInfo={
                    feature.infoKey
                      ? () => setRuleInfo(getHouseRuleInfo(feature.infoKey))
                      : undefined
                  }
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
        </SettingsSection>
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
