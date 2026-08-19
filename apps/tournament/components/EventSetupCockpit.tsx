"use client";

import { useEffect, useState } from "react";
import { MatchRulesFields } from "@/components/MatchRulesFields";
import { SetupSegmented } from "@/components/SetupSegmented";
import { SetupToggleRow } from "@/components/SetupToggleRow";
import { createTournament } from "@/lib/api";
import { APP_NAME, PARTICIPANT_APP_HINT, PARTICIPANT_APP_NAME } from "@/lib/branding";
import {
  DEFAULT_LEAGUE_SETTINGS,
  DEFAULT_MATCH_PREFS,
  DEFAULT_TURNIER_SETTINGS,
  buildEventConfigPayload,
  formatGroupPreview,
  type LeagueSettings,
  type MatchPrefs,
  type TurnierSettings,
} from "@/lib/eventConfig";
import { saveHostSession } from "@/lib/hostStore";
import { clearSetupDraft, loadSetupDraft, saveSetupDraft } from "@/lib/setupDraft";
import {
  DEFAULT_MAX_ENTRIES,
  MAX_ENTRIES_PRESETS,
  MAX_MAX_ENTRIES,
  MIN_MAX_ENTRIES,
  TOURNAMENT_MODE_OPTIONS,
  clampMaxEntries,
  type TournamentModeKey,
} from "@/lib/tournamentModes";

const GROUP_PRESETS = [3, 4, 5, 6] as const;

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

  const qualify =
    turnier.qualifyPerGroup >= turnier.groupSize ? 1 : turnier.qualifyPerGroup;

  return (
    <main className="t-shell t-shell--cockpit">
      <header className="t-cockpit-head">
        <p className="t-meta">{APP_NAME} · Einrichten</p>
        <h1 className="t-brand">Neues Event</h1>
        <p className="t-meta">Drei Container — alles auf einem Screen, dann Anlegen.</p>
      </header>

      <div className="t-cockpit-grid">
        <section className="t-card t-panel" aria-label="Event">
          <p className="t-label">Event</p>
          <div className="t-panel-body">
            <label className="t-label">
              Name
              <input
                className="t-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Freitagabend"
                maxLength={48}
                style={{ textTransform: "none", letterSpacing: "normal" }}
              />
            </label>
            <p className="t-label" style={{ marginTop: "0.85rem" }}>
              Format
            </p>
            <div className="t-stack" style={{ width: "100%" }}>
              {TOURNAMENT_MODE_OPTIONS.map((option) => {
                const selected = modeKey === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`t-choice${selected ? " t-choice--selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => setModeKey(option.key)}
                  >
                    <span className="t-choice-title">{option.label}</span>
                    <span className="t-choice-desc">{option.description}</span>
                  </button>
                );
              })}
            </div>
            <p className="t-label" style={{ marginTop: "0.85rem" }}>
              Max. Spieler
            </p>
            <div className="t-choice-grid">
              {MAX_ENTRIES_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`t-choice t-choice--compact${maxEntries === preset ? " t-choice--selected" : ""}`}
                  aria-pressed={maxEntries === preset}
                  onClick={() => {
                    setMaxEntries(preset);
                    setPlayerCountDraft(String(preset));
                  }}
                >
                  <span className="t-choice-title">{preset}</span>
                </button>
              ))}
            </div>
            <label className="t-label" style={{ marginTop: "0.75rem" }}>
              Eigene Zahl
              <input
                className="t-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="done"
                aria-label={`Spielerzahl ${MIN_MAX_ENTRIES} bis ${MAX_MAX_ENTRIES}`}
                value={playerCountDraft}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setPlayerCountDraft(raw);
                  if (raw === "") return;
                  const n = Number(raw);
                  if (
                    Number.isInteger(n) &&
                    n >= MIN_MAX_ENTRIES &&
                    n <= MAX_MAX_ENTRIES
                  ) {
                    setMaxEntries(n);
                  }
                }}
                onBlur={() => {
                  const n = Number(playerCountDraft);
                  const size = Number.isInteger(n)
                    ? clampMaxEntries(n)
                    : clampMaxEntries(maxEntries);
                  setMaxEntries(size);
                  setPlayerCountDraft(String(size));
                }}
                style={{ textTransform: "none", letterSpacing: "normal" }}
              />
            </label>
            <p className="t-setting-hint">
              {MIN_MAX_ENTRIES}–{MAX_MAX_ENTRIES} Spieler, nicht nur die Presets.
            </p>
          </div>
        </section>

        <div className="t-cockpit-center">
          <section
            className="t-card t-panel t-panel--compact"
            aria-label="Struktur"
          >
            <p className="t-label">{modeKey === "turnier" ? "Turnier" : "Liga"}</p>
            <div className="t-panel-body t-panel-body--compact">
              {modeKey === "league" ? (
                <>
                  <SetupToggleRow
                    title="Hin- und Rückspiel"
                    hint="Aus: einmal gegen jeden · An: zweimal gegen denselben Gegner"
                    checked={league.homeAndAway}
                    onChange={(homeAndAway) => setLeague({ homeAndAway })}
                  />
                  <p className="t-setting-hint">Wertung fest: Sieg +1.</p>
                </>
              ) : (
                <>
                  <p className="t-setting-title">Gruppengröße</p>
                  <div className="t-choice-grid">
                    {GROUP_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`t-choice t-choice--compact${turnier.groupSize === preset ? " t-choice--selected" : ""}`}
                        aria-pressed={turnier.groupSize === preset}
                        onClick={() =>
                          setTurnier({
                            groupSize: preset,
                            qualifyPerGroup:
                              turnier.qualifyPerGroup >= preset
                                ? 1
                                : turnier.qualifyPerGroup,
                          })
                        }
                      >
                        <span className="t-choice-title">{preset}</span>
                      </button>
                    ))}
                  </div>
                  <p className="t-setting-hint">
                    {formatGroupPreview(clampMaxEntries(maxEntries), turnier.groupSize)}
                  </p>
                  <p className="t-setting-title" style={{ marginTop: "0.75rem" }}>
                    Quali pro Gruppe
                  </p>
                  <SetupSegmented
                    ariaLabel="Qualifikation pro Gruppe"
                    value={String(qualify)}
                    options={[
                      { value: "1", label: "Top 1" },
                      ...(turnier.groupSize > 2 ? [{ value: "2", label: "Top 2" }] : []),
                    ]}
                    onChange={(value) =>
                      setTurnier({
                        ...turnier,
                        qualifyPerGroup: value === "2" ? 2 : 1,
                      })
                    }
                  />
                  <p className="t-setting-hint">Danach einfaches K.O.</p>
                </>
              )}
            </div>
          </section>

          <aside className="t-card t-pro-promo" aria-label={PARTICIPANT_APP_NAME}>
            <div className="t-pro-promo-mark" aria-hidden>
              <span className="t-pro-promo-dice">⚀</span>
              <span className="t-pro-promo-dice">⚁</span>
            </div>
            <div className="t-pro-promo-copy">
              <p className="t-pro-promo-eyebrow">Für alle Spieler</p>
              <p className="t-pro-promo-title">{PARTICIPANT_APP_NAME}</p>
              <p className="t-pro-promo-text">{PARTICIPANT_APP_HINT}</p>
            </div>
          </aside>

          <div className="t-cockpit-center-spacer" aria-hidden />

          <div className="t-setup-create-wrap">
            {error && (
              <p className="t-error t-setup-create-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              className="t-btn-create-event"
              disabled={busy}
              onClick={() => void onCreate()}
            >
              <span className="t-btn-create-event__shine" aria-hidden />
              <span className="t-btn-create-event__inner">
                <span className="t-btn-create-event__icon" aria-hidden>
                  +
                </span>
                <span className="t-btn-create-event__copy">
                  <span className="t-btn-create-event__label">
                    {busy ? "Wird angelegt …" : "Event anlegen"}
                  </span>
                  <span className="t-btn-create-event__sub">
                    {busy ? "Einen Moment" : "Turnier starten"}
                  </span>
                </span>
                <span className="t-btn-create-event__arrow" aria-hidden>
                  →
                </span>
              </span>
            </button>
          </div>
        </div>

        <section className="t-card t-panel t-panel--setup-match" aria-label="Partie">
          <div className="t-panel-body">
            <MatchRulesFields value={match} onChange={setMatch} />
          </div>
          <div className="t-panel-actions">
            {onCancel && (
              <button type="button" className="t-btn t-btn--ghost" onClick={onCancel}>
                Zur Lobby
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
