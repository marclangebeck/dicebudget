"use client";

import { useEffect, useState } from "react";
import { DiceBudgetProPromoBanner } from "@/components/DiceBudgetProPromoBanner";
import { EventCreateButton } from "@/components/EventCreateButton";
import {
  EventStudioContext,
  type StudioTab,
} from "@/components/EventStudioContext";
import { EventStudioPoster } from "@/components/EventStudioPoster";
import { createTournament } from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import {
  DEFAULT_LEAGUE_SETTINGS,
  DEFAULT_MATCH_PREFS,
  DEFAULT_TURNIER_SETTINGS,
  buildEventConfigPayload,
  type LeagueSettings,
  type MatchPrefs,
  type TurnierSettings,
} from "@/lib/eventConfig";
import { saveHostSession } from "@/lib/hostStore";
import { clearSetupDraft, loadSetupDraft, saveSetupDraft } from "@/lib/setupDraft";
import {
  DEFAULT_MAX_ENTRIES,
  clampMaxEntries,
  type TournamentModeKey,
} from "@/lib/tournamentModes";

type Props = {
  onCreated: () => void;
  onCancel?: () => void;
};

export function EventSetupCockpit({ onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [modeKey, setModeKey] = useState<TournamentModeKey>("league");
  const [maxEntries, setMaxEntries] = useState(DEFAULT_MAX_ENTRIES);
  const [playerCountDraft, setPlayerCountDraft] = useState(String(DEFAULT_MAX_ENTRIES));
  const [league, setLeague] = useState<LeagueSettings>(DEFAULT_LEAGUE_SETTINGS);
  const [turnier, setTurnier] = useState<TurnierSettings>(DEFAULT_TURNIER_SETTINGS);
  const [match, setMatch] = useState<MatchPrefs>(DEFAULT_MATCH_PREFS);
  const [tab, setTab] = useState<StudioTab>("format");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft) return;
    setName(draft.name);
    if (draft.modeKey) setModeKey(draft.modeKey);
    if (draft.maxEntries) {
      setMaxEntries(draft.maxEntries);
      setPlayerCountDraft(String(draft.maxEntries));
    }
    setLeague(draft.league);
    setTurnier(draft.turnier);
    setMatch(draft.match);
  }, []);

  function persistDraft(nextName: string) {
    saveSetupDraft({
      name: nextName,
      modeKey,
      maxEntries: clampMaxEntries(maxEntries),
      match,
      league,
      turnier,
    });
  }

  function normalizePlayerCountDraft() {
    const n = Number(playerCountDraft);
    const size = Number.isInteger(n)
      ? clampMaxEntries(n)
      : clampMaxEntries(maxEntries);
    setMaxEntries(size);
    setPlayerCountDraft(String(size));
  }

  async function onCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Bitte einen Event-Namen eingeben.");
      return;
    }
    const size = clampMaxEntries(maxEntries);
    persistDraft(trimmed);
    setBusy(true);
    setError(null);
    try {
      const res = await createTournament({
        name: trimmed,
        modeKey,
        maxEntries: size,
        config: buildEventConfigPayload(modeKey, match, league, turnier),
      });
      saveHostSession({
        tournamentId: res.tournament.id,
        inviteCode: res.tournament.inviteCode,
        hostToken: res.hostToken,
      });
      clearSetupDraft();
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Anlegen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  const nameMissing = name.trim().length === 0;

  return (
    <main className="t-shell t-shell--studio">
      <header className="t-studio-head">
        <div>
          <p className="t-meta">{APP_NAME}</p>
          <h1 className="t-brand">Event Studio</h1>
        </div>
        {onCancel && (
          <button type="button" className="t-btn t-btn--ghost t-studio-head-action" onClick={onCancel}>
            Zur Lobby
          </button>
        )}
      </header>

      <div className="t-studio-layout">
        <div className="t-studio-poster-col">
          <EventStudioPoster
            name={name}
            onNameChange={setName}
            modeKey={modeKey}
            maxEntries={maxEntries}
            league={league}
            turnier={turnier}
            match={match}
          />
          <DiceBudgetProPromoBanner />
          <div className="t-setup-create-wrap">
            {error && (
              <p className="t-error t-setup-create-error" role="alert">
                {error}
              </p>
            )}
            <EventCreateButton
              busy={busy}
              disabled={nameMissing}
              onClick={() => void onCreate()}
            />
          </div>
        </div>

        <EventStudioContext
          tab={tab}
          onTabChange={setTab}
          modeKey={modeKey}
          onModeKeyChange={setModeKey}
          maxEntries={maxEntries}
          playerCountDraft={playerCountDraft}
          onMaxEntriesChange={setMaxEntries}
          onPlayerCountDraftChange={setPlayerCountDraft}
          onPlayerCountBlur={normalizePlayerCountDraft}
          league={league}
          onLeagueChange={setLeague}
          turnier={turnier}
          onTurnierChange={setTurnier}
          match={match}
          onMatchChange={setMatch}
        />
      </div>
    </main>
  );
}
