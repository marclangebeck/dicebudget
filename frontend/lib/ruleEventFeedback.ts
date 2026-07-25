export type HouseRuleAutoEventDto =
  | {
      type: "yatzy_streak_penalty";
      poolsLost: number;
      victimPlayerId: string;
      victimPlayerName: string;
    }
  | {
      type: "yatzy_triple_penalty";
      poolsLost: number;
      victimPlayerId: string;
      victimPlayerName: string;
    }
  | {
      type: "upper_race_pool";
      poolsGained: number;
    };

export type RuleEventOverlayState = {
  kind: "yatzy_streak_penalty" | "yatzy_triple_penalty" | "upper_race_pool";
  title: string;
  subtitle: string;
  badge: string;
};

export function ruleEventFromDto(event: HouseRuleAutoEventDto): RuleEventOverlayState | null {
  if (event.type === "yatzy_triple_penalty") {
    if (event.poolsLost <= 0) {
      return {
        kind: "yatzy_triple_penalty",
        title: "3× Alle Fünfe",
        subtitle: "Gegner-Pool bereits 0 — keine Strafe nötig",
        badge: "±0",
      };
    }
    return {
      kind: "yatzy_triple_penalty",
      title: "3× Alle Fünfe!",
      subtitle: `Gegner verliert den gesamten Pool (−${event.poolsLost})`,
      badge: `−${event.poolsLost}`,
    };
  }
  if (event.type === "yatzy_streak_penalty") {
    if (event.poolsLost <= 0) {
      return {
        kind: "yatzy_streak_penalty",
        title: "2× Alle Fünfe",
        subtitle: "Gegner-Pool bereits 0 — keine Strafe nötig",
        badge: "±0",
      };
    }
    return {
      kind: "yatzy_streak_penalty",
      title: "2× Alle Fünfe!",
      subtitle: `Gegner-Pool halbiert (−${event.poolsLost})`,
      badge: `−${event.poolsLost}`,
    };
  }
  if (event.type === "upper_race_pool") {
    return {
      kind: "upper_race_pool",
      title: "Oberer Bereich zuerst voll",
      subtitle:
        event.poolsGained === 1
          ? "1 offenes Feld des Rivalen → +1 Pool"
          : `${event.poolsGained} offene Felder des Rivalen → +${event.poolsGained} Pool`,
      badge: `+${event.poolsGained}`,
    };
  }
  return null;
}
