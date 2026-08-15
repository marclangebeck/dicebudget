export type HouseRuleAutoEventDto =
  | {
      type: "yatzy_streak_penalty";
      poolsLost: number;
      victimPlayerId: string;
      victimPlayerName: string;
      victimCount?: number;
      poolsGained?: number;
    }
  | {
      type: "yatzy_triple_penalty";
      poolsLost: number;
      victimPlayerId: string;
      victimPlayerName: string;
      victimCount?: number;
      poolsGained?: number;
    }
  | {
      type: "upper_race_pool";
      poolsGained: number;
    }
  | {
      type: "column_pool_upper";
      poolsGained: number;
    }
  | {
      type: "column_pool_lower";
      poolsGained: number;
    }
  | {
      type: "column_pool_combo";
      poolsGained: number;
    };

export type RuleEventOverlayState = {
  kind:
    | "yatzy_streak_penalty"
    | "yatzy_triple_penalty"
    | "upper_race_pool"
    | "column_pool_upper"
    | "column_pool_lower"
    | "column_pool_combo";
  title: string;
  subtitle: string;
  badge: string;
};

function yatzyCreditSuffix(poolsGained: number | undefined): string {
  if (!poolsGained || poolsGained <= 0) return "";
  return ` · dir +${poolsGained}`;
}

export function ruleEventFromDto(event: HouseRuleAutoEventDto): RuleEventOverlayState | null {
  if (event.type === "yatzy_triple_penalty") {
    const credit = yatzyCreditSuffix(event.poolsGained);
    const many = (event.victimCount ?? 1) > 1;
    if (event.poolsLost <= 0) {
      return {
        kind: "yatzy_triple_penalty",
        title: "3× Alle Fünfe",
        subtitle: many
          ? "Mitspieler-Pools bereits 0 — keine Strafe nötig"
          : "Gegner-Pool bereits 0 — keine Strafe nötig",
        badge: "±0",
      };
    }
    return {
      kind: "yatzy_triple_penalty",
      title: "3× Alle Fünfe!",
      subtitle: many
        ? `Mitspieler verlieren den gesamten Pool (−${event.poolsLost})${credit}`
        : `Gegner verliert den gesamten Pool (−${event.poolsLost})${credit}`,
      badge: event.poolsGained && event.poolsGained > 0
        ? `+${event.poolsGained}`
        : `−${event.poolsLost}`,
    };
  }
  if (event.type === "yatzy_streak_penalty") {
    const credit = yatzyCreditSuffix(event.poolsGained);
    const many = (event.victimCount ?? 1) > 1;
    if (event.poolsLost <= 0) {
      return {
        kind: "yatzy_streak_penalty",
        title: "2× Alle Fünfe",
        subtitle: many
          ? "Mitspieler-Pools bereits 0 — keine Strafe nötig"
          : "Gegner-Pool bereits 0 — keine Strafe nötig",
        badge: "±0",
      };
    }
    return {
      kind: "yatzy_streak_penalty",
      title: "2× Alle Fünfe!",
      subtitle: many
        ? `Mitspieler verlieren je 1/n Pool (−${event.poolsLost})${credit}`
        : `Gegner-Pool halbiert (−${event.poolsLost})${credit}`,
      badge: event.poolsGained && event.poolsGained > 0
        ? `+${event.poolsGained}`
        : `−${event.poolsLost}`,
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
  if (event.type === "column_pool_upper") {
    return {
      kind: "column_pool_upper",
      title: "Spalte oben mit Bonus!",
      subtitle: `Erste Spalte 1–6 mit Bonus → +${event.poolsGained} Pool`,
      badge: `+${event.poolsGained}`,
    };
  }
  if (event.type === "column_pool_lower") {
    return {
      kind: "column_pool_lower",
      title: "Spalte unten voll!",
      subtitle: `Erster kompletter unterer Bereich → +${event.poolsGained} Pool`,
      badge: `+${event.poolsGained}`,
    };
  }
  if (event.type === "column_pool_combo") {
    return {
      kind: "column_pool_combo",
      title: "Durchgängige Spalte!",
      subtitle: `Oben mit Bonus und unten in derselben Spalte → +${event.poolsGained} Pool`,
      badge: `+${event.poolsGained}`,
    };
  }
  return null;
}
