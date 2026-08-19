"use client";

import { MatchRulesFields } from "@/components/MatchRulesFields";
import { SetupSegmented } from "@/components/SetupSegmented";
import { SetupToggleRow } from "@/components/SetupToggleRow";
import {
  formatGroupPreview,
  type LeagueSettings,
  type MatchPrefs,
  type TurnierSettings,
} from "@/lib/eventConfig";
import {
  MAX_ENTRIES_PRESETS,
  MAX_MAX_ENTRIES,
  MIN_MAX_ENTRIES,
  TOURNAMENT_MODE_OPTIONS,
  clampMaxEntries,
  type TournamentModeKey,
} from "@/lib/tournamentModes";

const GROUP_PRESETS = [3, 4, 5, 6] as const;

export type StudioTab = "format" | "size" | "structure" | "match";

const STUDIO_TABS: { id: StudioTab; label: string }[] = [
  { id: "format", label: "Format" },
  { id: "size", label: "Größe" },
  { id: "structure", label: "Struktur" },
  { id: "match", label: "Partie" },
];

type Props = {
  tab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  modeKey: TournamentModeKey;
  onModeKeyChange: (modeKey: TournamentModeKey) => void;
  maxEntries: number;
  playerCountDraft: string;
  onMaxEntriesChange: (value: number) => void;
  onPlayerCountDraftChange: (value: string) => void;
  onPlayerCountBlur: () => void;
  league: LeagueSettings;
  onLeagueChange: (league: LeagueSettings) => void;
  turnier: TurnierSettings;
  onTurnierChange: (turnier: TurnierSettings) => void;
  match: MatchPrefs;
  onMatchChange: (match: MatchPrefs) => void;
};

export function EventStudioContext({
  tab,
  onTabChange,
  modeKey,
  onModeKeyChange,
  maxEntries,
  playerCountDraft,
  onMaxEntriesChange,
  onPlayerCountDraftChange,
  onPlayerCountBlur,
  league,
  onLeagueChange,
  turnier,
  onTurnierChange,
  match,
  onMatchChange,
}: Props) {
  const qualify =
    turnier.qualifyPerGroup >= turnier.groupSize ? 1 : turnier.qualifyPerGroup;

  return (
    <section className="t-studio-context" aria-label="Event einrichten">
      <nav className="t-studio-tabs" aria-label="Bereiche">
        {STUDIO_TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`t-studio-tab${active ? " is-active" : ""}`}
              aria-current={active ? "step" : undefined}
              onClick={() => onTabChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="t-studio-context-body">
        {tab === "format" && (
          <div className="t-studio-pane">
            <h2 className="t-studio-pane-title">Format wählen</h2>
            <p className="t-studio-pane-lead">
              Liga für Round-Robin, Turnier für Gruppenphase und K.O.
            </p>
            <div className="t-stack">
              {TOURNAMENT_MODE_OPTIONS.map((option) => {
                const selected = modeKey === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`t-choice${selected ? " t-choice--selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => onModeKeyChange(option.key)}
                  >
                    <span className="t-choice-title">{option.label}</span>
                    <span className="t-choice-desc">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "size" && (
          <div className="t-studio-pane">
            <h2 className="t-studio-pane-title">Spielerzahl</h2>
            <p className="t-studio-pane-lead">
              Wie viele Plätze das Event maximal haben soll.
            </p>
            <div className="t-choice-grid">
              {MAX_ENTRIES_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`t-choice t-choice--compact${maxEntries === preset ? " t-choice--selected" : ""}`}
                  aria-pressed={maxEntries === preset}
                  onClick={() => {
                    onMaxEntriesChange(preset);
                    onPlayerCountDraftChange(String(preset));
                  }}
                >
                  <span className="t-choice-title">{preset}</span>
                </button>
              ))}
            </div>
            <label className="t-label" style={{ marginTop: "0.85rem" }}>
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
                  onPlayerCountDraftChange(raw);
                  if (raw === "") return;
                  const n = Number(raw);
                  if (
                    Number.isInteger(n) &&
                    n >= MIN_MAX_ENTRIES &&
                    n <= MAX_MAX_ENTRIES
                  ) {
                    onMaxEntriesChange(n);
                  }
                }}
                onBlur={onPlayerCountBlur}
                style={{ textTransform: "none", letterSpacing: "normal" }}
              />
            </label>
            <p className="t-setting-hint">
              {MIN_MAX_ENTRIES}–{MAX_MAX_ENTRIES} Spieler möglich.
            </p>
          </div>
        )}

        {tab === "structure" && (
          <div className="t-studio-pane">
            <h2 className="t-studio-pane-title">
              {modeKey === "turnier" ? "Turnier-Struktur" : "Liga-Struktur"}
            </h2>
            {modeKey === "league" ? (
              <>
                <p className="t-studio-pane-lead">
                  Feste Wertung: Sieg bringt einen Punkt in der Tabelle.
                </p>
                <SetupToggleRow
                  title="Hin- und Rückspiel"
                  hint="Aus: einmal gegen jeden · An: zweimal gegen denselben Gegner"
                  checked={league.homeAndAway}
                  onChange={(homeAndAway) => onLeagueChange({ homeAndAway })}
                />
              </>
            ) : (
              <>
                <p className="t-studio-pane-lead">
                  Gruppenphase, dann qualifizierte Teams im K.O.
                </p>
                <p className="t-setting-title">Gruppengröße</p>
                <div className="t-choice-grid">
                  {GROUP_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`t-choice t-choice--compact${turnier.groupSize === preset ? " t-choice--selected" : ""}`}
                      aria-pressed={turnier.groupSize === preset}
                      onClick={() =>
                        onTurnierChange({
                          groupSize: preset,
                          qualifyPerGroup:
                            turnier.qualifyPerGroup >= preset ? 1 : turnier.qualifyPerGroup,
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
                    onTurnierChange({
                      ...turnier,
                      qualifyPerGroup: value === "2" ? 2 : 1,
                    })
                  }
                />
              </>
            )}
          </div>
        )}

        {tab === "match" && (
          <div className="t-studio-pane t-studio-pane--match">
            <h2 className="t-studio-pane-title">Partie-Regeln</h2>
            <p className="t-studio-pane-lead">
              Modus, Spiele pro Begegnung und Hausregeln — wie in DiceBudget.
            </p>
            <MatchRulesFields embedded value={match} onChange={onMatchChange} />
          </div>
        )}
      </div>
    </section>
  );
}
