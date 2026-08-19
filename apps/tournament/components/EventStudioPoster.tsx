"use client";

import { PARTICIPANT_APP_HINT, PARTICIPANT_APP_NAME } from "@/lib/branding";
import {
  formatGroupPreview,
  matchModeLabel,
  type LeagueSettings,
  type MatchPrefs,
  type TurnierSettings,
} from "@/lib/eventConfig";
import { listTopHouseRules } from "@/lib/houseRules";
import type { TournamentModeKey } from "@/lib/tournamentModes";

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  modeKey: TournamentModeKey;
  maxEntries: number;
  league: LeagueSettings;
  turnier: TurnierSettings;
  match: MatchPrefs;
};

function activeHouseRuleCount(match: MatchPrefs): number {
  return listTopHouseRules().filter((rule) => match.houseRules[rule.id]).length;
}

export function EventStudioPoster({
  name,
  onNameChange,
  modeKey,
  maxEntries,
  league,
  turnier,
  match,
}: Props) {
  const trimmed = name.trim();
  const houseRulesOn = activeHouseRuleCount(match);

  const structureChips: string[] =
    modeKey === "league"
      ? [league.homeAndAway ? "Hin- und Rückspiel" : "Ein Durchgang", "Sieg +1"]
      : [
          `Gruppen à ${turnier.groupSize}`,
          `Top ${turnier.qualifyPerGroup} qualifiziert`,
          "K.O.-Phase",
        ];

  const matchChips: string[] = [
    matchModeLabel(match.useStrategyRules),
    `${match.gameCount} ${match.gameCount === 1 ? "Spiel" : "Spiele"} pro Partie`,
  ];
  if (match.useStrategyRules && match.showOpponentPool) {
    matchChips.push("Gegner-Pool");
  }
  if (match.useStrategyRules && match.poolEndgameEnabled) {
    matchChips.push("Pool-Endspiel");
  }
  matchChips.push(`${houseRulesOn} Hausregeln`);

  return (
    <article className="t-studio-poster" aria-label="Event-Vorschau">
      <div className="t-studio-poster-glow" aria-hidden />
      <div className="t-studio-poster-inner">
        <div className="t-studio-poster-top">
          <span
            className={`t-studio-badge${modeKey === "turnier" ? " t-studio-badge--cup" : ""}`}
          >
            {modeKey === "league" ? "Liga" : "Turnier"}
          </span>
          <span className="t-studio-poster-meta">{maxEntries} Spieler max.</span>
        </div>

        <label className="t-studio-poster-name-wrap">
          <span className="sr-only">Event-Name</span>
          <input
            className={`t-studio-poster-name${trimmed ? "" : " is-empty"}`}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Event benennen …"
            maxLength={48}
            autoComplete="off"
          />
        </label>

        {modeKey === "turnier" && (
          <p className="t-studio-poster-preview">
            {formatGroupPreview(maxEntries, turnier.groupSize)}
          </p>
        )}

        <div className="t-studio-chip-block">
          <p className="t-studio-chip-label">Struktur</p>
          <div className="t-studio-chips">
            {structureChips.map((chip) => (
              <span key={chip} className="t-studio-chip">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="t-studio-chip-block">
          <p className="t-studio-chip-label">Partie</p>
          <div className="t-studio-chips">
            {matchChips.map((chip) => (
              <span key={chip} className="t-studio-chip t-studio-chip--match">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <footer className="t-studio-poster-pro">
          <span className="t-studio-poster-pro-mark" aria-hidden>
            ⚀
          </span>
          <div>
            <p className="t-studio-poster-pro-title">{PARTICIPANT_APP_NAME}</p>
            <p className="t-studio-poster-pro-text">{PARTICIPANT_APP_HINT}</p>
          </div>
        </footer>
      </div>
    </article>
  );
}
