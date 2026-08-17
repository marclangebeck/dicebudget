"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MatchRulesFields } from "@/components/MatchRulesFields";
import { SetupStepperRow } from "@/components/SetupStepperRow";
import { APP_NAME } from "@/lib/branding";
import {
  DEFAULT_LEAGUE_SETTINGS,
  DEFAULT_MATCH_PREFS,
  LEAGUE_ROUNDS_MAX,
  LEAGUE_ROUNDS_MIN,
  type LeagueSettings,
  type MatchPrefs,
} from "@/lib/eventConfig";
import { loadSetupDraft, patchSetupDraft } from "@/lib/setupDraft";

export default function SetupLeaguePage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [maxEntries, setMaxEntries] = useState<number | null>(null);
  const [league, setLeague] = useState<LeagueSettings>(DEFAULT_LEAGUE_SETTINGS);
  const [match, setMatch] = useState<MatchPrefs>(DEFAULT_MATCH_PREFS);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || draft.modeKey !== "league" || !draft.maxEntries) {
      if (!draft?.name.trim()) router.replace("/");
      else if (draft.modeKey === "turnier") router.replace("/setup/turnier");
      else if (!draft.modeKey) router.replace("/setup");
      else router.replace("/setup/size");
      return;
    }
    setName(draft.name.trim());
    setMaxEntries(draft.maxEntries);
    setLeague(draft.league);
    setMatch(draft.match);
  }, [router]);

  function onContinue() {
    const next = patchSetupDraft({ league, match });
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

  return (
    <main className="t-shell">
      <p className="t-meta">{APP_NAME} · Liga</p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        Liga-Einstellungen
      </h1>
      <p className="t-meta">
        {name} · max. {maxEntries} Spieler
      </p>

      <div className="t-stack" style={{ width: "min(100%, 36rem)" }}>
        <section className="t-card" aria-label="Liga-Struktur">
          <p className="t-label" style={{ marginBottom: "0.35rem" }}>
            Liga
          </p>
          <SetupStepperRow
            title="Runden"
            hint="Wie oft die Liga-Runde gespielt wird"
            value={league.rounds}
            min={LEAGUE_ROUNDS_MIN}
            max={LEAGUE_ROUNDS_MAX}
            onChange={(rounds) => setLeague({ rounds })}
          />
          <p className="t-setting-hint" style={{ margin: "0.45rem 0 0" }}>
            Wertung fest: Sieg +1. Differenz-Bonus wie in der Multi-Serie folgt
            später.
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
