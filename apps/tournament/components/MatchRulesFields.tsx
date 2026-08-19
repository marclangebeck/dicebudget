"use client";

import { SetupSegmented } from "@/components/SetupSegmented";
import { SetupStepperRow } from "@/components/SetupStepperRow";
import { SetupToggleRow } from "@/components/SetupToggleRow";
import {
  MATCH_GAME_COUNT_MAX,
  MATCH_GAME_COUNT_MIN,
  type MatchPrefs,
} from "@/lib/eventConfig";
import {
  listChildHouseRules,
  listTopHouseRules,
  setHouseRule,
  type HouseRuleId,
} from "@/lib/houseRules";

type Props = {
  value: MatchPrefs;
  onChange: (next: MatchPrefs) => void;
  /** Ohne äußere Karte — für Event Studio Kontext-Panel. */
  embedded?: boolean;
};

export function MatchRulesFields({ value, onChange, embedded = false }: Props) {
  function toggleHouseRule(id: HouseRuleId, checked: boolean) {
    onChange({
      ...value,
      houseRules: setHouseRule(value.houseRules, id, checked),
    });
  }

  const body = (
    <>
      {!embedded && (
        <p className="t-label" style={{ marginBottom: "0.65rem" }}>
          Partie
        </p>
      )}
      <SetupSegmented
        ariaLabel="Spielmodus"
        value={value.useStrategyRules ? "strategy" : "classic"}
        options={[
          { value: "classic", label: "Klassisch" },
          { value: "strategy", label: "Strategy" },
        ]}
        onChange={(next) =>
          onChange({
            ...value,
            useStrategyRules: next === "strategy",
            showOpponentPool: next === "strategy" ? value.showOpponentPool : false,
            poolEndgameEnabled: next === "strategy" ? value.poolEndgameEnabled : false,
          })
        }
      />
      <p className="t-setting-hint" style={{ margin: "0.55rem 0 0.35rem" }}>
        {value.useStrategyRules
          ? "Wurf-Pool und begrenzte Gesamtwürfe."
          : "Ohne Pool — nur Punkte eintragen."}
      </p>
      <SetupStepperRow
        title="Spiele pro Partie"
        hint="1–6 Zettel in einer Begegnung"
        value={value.gameCount}
        min={MATCH_GAME_COUNT_MIN}
        max={MATCH_GAME_COUNT_MAX}
        onChange={(gameCount) => onChange({ ...value, gameCount })}
      />
      {value.useStrategyRules && (
        <>
          <SetupToggleRow
            title="Gegner-Pool"
            hint="Pool der Mitspieler anzeigen"
            checked={value.showOpponentPool}
            onChange={(showOpponentPool) => onChange({ ...value, showOpponentPool })}
          />
          <SetupToggleRow
            title="Pool-Endspiel"
            hint="Pool-Sieger verbessert ein Feld"
            checked={value.poolEndgameEnabled}
            onChange={(poolEndgameEnabled) =>
              onChange({ ...value, poolEndgameEnabled })
            }
          />
        </>
      )}
      <p className="t-label" style={{ marginTop: "0.85rem" }}>
        Spielregeln
      </p>
      <p className="t-setting-hint" style={{ margin: "0 0 0.35rem" }}>
        Wie in DiceBudget unter InApp-Features.
      </p>
      {listTopHouseRules().map((option) => (
        <div key={option.id}>
          <SetupToggleRow
            title={option.title}
            hint={option.description}
            checked={value.houseRules[option.id]}
            onChange={(checked) => toggleHouseRule(option.id, checked)}
          />
          {value.houseRules[option.id] &&
            listChildHouseRules(option.id).map((child) => (
              <SetupToggleRow
                key={child.id}
                title={child.title}
                hint={child.description}
                nested
                checked={value.houseRules[child.id]}
                onChange={(checked) => toggleHouseRule(child.id, checked)}
              />
            ))}
        </div>
      ))}
    </>
  );

  if (embedded) {
    return body;
  }

  return (
    <section className="t-card" aria-label="Partie-Regeln">
      {body}
    </section>
  );
}
