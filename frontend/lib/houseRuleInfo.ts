export type HouseRuleInfoKey =
  | "burn"
  | "rollSale"
  | "yatzyStreak2"
  | "yatzyStreak3"
  | "upperRace";

export type HouseRuleInfo = {
  key: HouseRuleInfoKey;
  title: string;
  body: string;
};

export const HOUSE_RULE_INFO: Record<HouseRuleInfoKey, HouseRuleInfo> = {
  burn: {
    key: "burn",
    title: "Brennt",
    body:
      "Wenn ein Wurf am Tisch ungültig ist (z. B. Würfel vom Tisch), kostet das 1 Pool. Danach wird physisch neu gewürfelt. Nur am Anfang eines leeren Feldes, nicht bei Korrekturen.",
  },
  rollSale: {
    key: "rollSale",
    title: "Wurf verkaufen",
    body:
      "Hat ein Spieler eine komplette Feldzeile (z. B. alle Großen Straßen), kann er einen Wurf an einen Mitspieler verkaufen. Der Käufer zahlt Pool; der Verkäufer trägt danach ein Freifeld ohne Würfeln ein.",
  },
  yatzyStreak2: {
    key: "yatzyStreak2",
    title: "2× Alle Fünfe",
    body:
      "Trägst du zwei Alle Fünfe hintereinander mit höchstens 3 Würfen ein, verliert der Gegner die Hälfte seines Pools (abgerundet). Im Duell (2 Spieler) automatisch; bei mehr Spielern manuell.",
  },
  yatzyStreak3: {
    key: "yatzyStreak3",
    title: "3× Alle Fünfe",
    body:
      "Trägst du drei Alle Fünfe hintereinander mit höchstens 3 Würfen ein, verliert der Gegner seinen gesamten Pool. Im Duell automatisch. Hat Vorrang vor der 2×-Strafe.",
  },
  upperRace: {
    key: "upperRace",
    title: "Oberer Bereich zuerst",
    body:
      "Wer zuerst alle oberen Felder über alle Spiele voll hat (Anzahl Spiele × 6), erhält so viele Pool-Würfe, wie der Rivale oben noch offen hat. Nur Duell, nur einmal pro Partie.",
  },
};

export function getHouseRuleInfo(key: string | undefined): HouseRuleInfo | null {
  if (!key) return null;
  return HOUSE_RULE_INFO[key as HouseRuleInfoKey] ?? null;
}
