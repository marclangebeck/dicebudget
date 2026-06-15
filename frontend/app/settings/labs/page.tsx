"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { LabsUnlockDialog } from "@/components/LabsUnlockDialog";
import { parseSettingsReturn } from "@/lib/settingsReturn";
import {
  FEATURE_FLAGS_CHANGED_EVENT,
  isFeatureEnabled,
  listLabsFeatures,
  setLabsFeaturePref,
  type FeatureDefinition,
} from "@/lib/featureFlags";
import {
  isLabsUnlocked,
  lockLabs,
  subscribeLabsAccess,
} from "@/lib/labsAccess";

function LabsFeatureToggle({
  feature,
  enabled,
  onChange,
}: {
  feature: FeatureDefinition;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="settings-compact-card settings-compact-card--toggle">
      <div className="min-w-0">
        <p className="settings-compact-title">{feature.title}</p>
        <p className="settings-compact-text">{feature.description}</p>
        <p className="mt-1 font-mono text-[0.65rem] text-slate-500">{feature.id}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${feature.title} ${enabled ? "deaktivieren" : "aktivieren"}`}
        onClick={() => onChange(!enabled)}
        className="app-toggle relative h-8 w-14 shrink-0 rounded-full border-2 transition"
      >
        <span
          className={`absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
            enabled ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function LabsSettingsInner() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const returnTarget = parseSettingsReturn(fromParam);
  const [unlocked, setUnlocked] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setUnlocked(isLabsUnlocked());
    return subscribeLabsAccess(() => setUnlocked(isLabsUnlocked()));
  }, []);

  useEffect(() => {
    function bump() {
      setRevision((value) => value + 1);
    }
    window.addEventListener(FEATURE_FLAGS_CHANGED_EVENT, bump);
    return () => window.removeEventListener(FEATURE_FLAGS_CHANGED_EVENT, bump);
  }, []);

  const labsFeatures = listLabsFeatures();
  void revision;

  const backHref =
    fromParam === "solo" || fromParam === "multi"
      ? `/settings?from=${fromParam}`
      : "/settings";

  if (!unlocked) {
    return (
      <div className="settings-screen">
        <AppScreenHeader
          section="Einstellungen"
          title="Entwickler-Vorschau"
          subtitle="Experimentelle Features testen, bevor sie für alle freigeschaltet werden."
          backHref={backHref}
          backLabel="Zurück zu Einstellungen"
        />
        <section className="settings-group">
          <div className="settings-compact-card settings-compact-card--wide">
            <p className="settings-compact-title">Vorschau gesperrt</p>
            <p className="settings-compact-text mt-2">
              Gib deinen persönlichen Code ein, um neue Features einzeln zu aktivieren.
            </p>
            <button
              type="button"
              onClick={() => setShowUnlock(true)}
              className="glass-button glass-button--primary mt-4 min-h-11 w-full px-4 text-sm font-semibold"
            >
              Code eingeben
            </button>
          </div>
        </section>
        <LabsUnlockDialog
          open={showUnlock}
          onClose={() => setShowUnlock(false)}
          onUnlocked={() => setUnlocked(true)}
        />
      </div>
    );
  }

  return (
    <div className="settings-screen">
      <AppScreenHeader
        section="Einstellungen"
        title="Entwickler-Vorschau"
        subtitle="Schalte neue Features einzeln an. Marktreife Features wandern in die normalen Einstellungen."
        backHref={backHref}
        backLabel="Zurück zu Einstellungen"
      />

      <section className="settings-group">
        <h2 className="settings-group-title">Vorschau-Features</h2>
        <div className="settings-card-grid">
          {labsFeatures.length === 0 ? (
            <div className="settings-compact-card settings-compact-card--wide">
              <p className="settings-compact-title">Noch keine Vorschau-Features</p>
              <p className="settings-compact-text mt-2">
                Neue Funktionen werden in <code className="text-xs">featureFlags.ts</code>{" "}
                registriert und erscheinen hier zum Testen.
              </p>
            </div>
          ) : (
            labsFeatures.map((feature) => (
              <LabsFeatureToggle
                key={feature.id}
                feature={feature}
                enabled={isFeatureEnabled(feature.id)}
                onChange={(value) => setLabsFeaturePref(feature.id, value)}
              />
            ))
          )}
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group-title">Zugang</h2>
        <div className="settings-card-grid">
          <div className="settings-compact-card settings-compact-card--wide">
            <p className="settings-compact-title">Vorschau sperren</p>
            <p className="settings-compact-text mt-2">
              Entfernt den Zugang auf diesem Gerät. Aktive Vorschau-Toggles bleiben gespeichert.
            </p>
            <button
              type="button"
              onClick={() => lockLabs()}
              className="glass-button mt-4 min-h-11 w-full px-4 text-sm font-semibold"
            >
              Vorschau sperren
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LabsSettingsPage() {
  return (
    <Suspense fallback={null}>
      <LabsSettingsInner />
    </Suspense>
  );
}
