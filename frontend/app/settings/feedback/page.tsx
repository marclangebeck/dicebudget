"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import {
  DEFAULT_GAME_FEEDBACK_PREFS,
  getGameFeedbackPrefs,
  setGameFeedbackPrefs,
  type GameFeedbackPrefs,
} from "@/lib/gameFeedbackPrefs";

function FeedbackSwitch({
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

function FeedbackSettingsInner() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const backHref = from === "solo" || from === "multi" ? `/settings?from=${from}` : "/settings";
  const [prefs, setPrefs] = useState<GameFeedbackPrefs>(DEFAULT_GAME_FEEDBACK_PREFS);

  useEffect(() => {
    setPrefs(getGameFeedbackPrefs());
  }, []);

  function update(update: Partial<GameFeedbackPrefs>) {
    setPrefs((current) => setGameFeedbackPrefs({ ...current, ...update }));
  }

  return (
    <div className="settings-screen">
      <AppScreenHeader
        section="Einstellungen"
        title="Spiel-Feedback"
        subtitle="Erfolgsanimationen, Sounds und Fortschrittshinweise einzeln steuern."
        backHref={backHref}
        backLabel="Zurück zu Einstellungen"
      />

      <section className="settings-group">
        <h2 className="settings-group-title">Feedback</h2>
        <div className="settings-card-grid">
          <FeedbackSwitch
            checked={prefs.animationsEnabled}
            onChange={(value) => update({ animationsEnabled: value })}
            title="Erfolgsanimationen"
            description="Grafische Overlays bei Bonus, unterer Spalte, Große Straße und Alle Fünfe."
          />
          <FeedbackSwitch
            checked={prefs.soundsEnabled}
            onChange={(value) => update({ soundsEnabled: value })}
            title="Sounds"
            description="Akustische Hinweise bei Erfolgen und Fortschritts-Meilensteinen."
          />
          <FeedbackSwitch
            checked={prefs.progressHintsEnabled}
            onChange={(value) => update({ progressHintsEnabled: value })}
            title="Fortschritt (25 / 50 / 75 %)"
            description="Kurzer grafischer Hinweis, wenn ein Viertel der Würfe absolviert ist."
          />
        </div>
      </section>
    </div>
  );
}

export default function FeedbackSettingsPage() {
  return (
    <Suspense fallback={null}>
      <FeedbackSettingsInner />
    </Suspense>
  );
}
