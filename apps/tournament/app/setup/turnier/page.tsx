"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MatchRulesFields } from "@/components/MatchRulesFields";
import { SetupSegmented } from "@/components/SetupSegmented";
import { APP_NAME } from "@/lib/branding";
import {
  DEFAULT_MATCH_PREFS,
  DEFAULT_TURNIER_SETTINGS,
  formatGroupPreview,
  type MatchPrefs,
  type TurnierSettings,
} from "@/lib/eventConfig";
import { loadSetupDraft, patchSetupDraft } from "@/lib/setupDraft";

const GROUP_PRESETS = [3, 4, 5, 6] as const;

export default function SetupTurnierPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [maxEntries, setMaxEntries] = useState<number | null>(null);
  const [turnier, setTurnier] = useState<TurnierSettings>(DEFAULT_TURNIER_SETTINGS);
  const [match, setMatch] = useState<MatchPrefs>(DEFAULT_MATCH_PREFS);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || draft.modeKey !== "turnier" || !draft.maxEntries) {
      if (!draft?.name.trim()) router.replace("/");
      else if (draft.modeKey === "league") router.replace("/setup/league");
      else if (!draft.modeKey) router.replace("/setup");
      else router.replace("/setup/size");
      return;
    }
    setName(draft.name.trim());
    setMaxEntries(draft.maxEntries);
    setTurnier(draft.turnier);
    setMatch(draft.match);
  }, [router]);

  function onContinue() {
    const next = patchSetupDraft({ turnier, match });
    if (!next) {
      router.replace("/");
      return;
    }
    router.push("/setup/review");
  }

  if (!name || maxEntries == null) {
    return (
      <main className="t-shell">
        <p className="t-meta">Lade…</p>
      </main>
    );
  }

  const qualify =
    turnier.qualifyPerGroup >= turnier.groupSize ? 1 : turnier.qualifyPerGroup;

  return (
    <main className="t-shell">
      <p className="t-meta">{APP_NAME} · Turnier</p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        Turnier-Einstellungen
      </h1>
      <p className="t-meta">
        {name} · max. {maxEntries} Spieler
      </p>

      <div className="t-stack" style={{ width: "min(100%, 36rem)" }}>
        <section className="t-card" aria-label="Turnier-Struktur">
          <p className="t-label" style={{ marginBottom: "0.65rem" }}>
            Vorrunde
          </p>
          <p className="t-setting-title" style={{ marginBottom: "0.45rem" }}>
            Gruppengröße
          </p>
          <div className="t-choice-grid">
            {GROUP_PRESETS.map((preset) => {
              const selected = turnier.groupSize === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  className={`t-choice t-choice--compact${selected ? " t-choice--selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() =>
                    setTurnier({
                      groupSize: preset,
                      qualifyPerGroup:
                        turnier.qualifyPerGroup >= preset ? 1 : turnier.qualifyPerGroup,
                    })
                  }
                >
                  <span className="t-choice-title">{preset}</span>
                </button>
              );
            })}
          </div>
          <p className="t-setting-hint" style={{ margin: "0.7rem 0 0.45rem" }}>
            {formatGroupPreview(maxEntries, turnier.groupSize)}
          </p>
          <p className="t-setting-title" style={{ margin: "0.85rem 0 0.45rem" }}>
            Quali pro Gruppe
          </p>
          <SetupSegmented
            ariaLabel="Qualifikation pro Gruppe"
            value={String(qualify)}
            options={[
              { value: "1", label: "Top 1" },
              ...(turnier.groupSize > 2
                ? [{ value: "2", label: "Top 2" }]
                : []),
            ]}
            onChange={(value) =>
              setTurnier({
                ...turnier,
                qualifyPerGroup: value === "2" ? 2 : 1,
              })
            }
          />
          <p className="t-setting-hint" style={{ margin: "0.7rem 0 0" }}>
            Danach: einfaches K.O. (kein Doppel-K.O.).
          </p>
        </section>

        <MatchRulesFields value={match} onChange={setMatch} />
      </div>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <Link href="/setup/size" className="t-btn t-btn--ghost">
          Zurück
        </Link>
        <button type="button" className="t-btn" onClick={onContinue}>
          Weiter
        </button>
      </div>
    </main>
  );
}
