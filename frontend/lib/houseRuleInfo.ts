export type HouseRuleInfoKey =
  | "burn"
  | "rollSale"
  | "yatzyStreak2"
  | "yatzyStreak3"
  | "upperRace"
  | "columnPoolBonuses";

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
      "Trägst du zwei echte Alle Fünfe (je 50 Punkte) hintereinander mit höchstens 3 Würfen ein, verliert der Gegner die Hälfte seines Pools (abgerundet). Null-Einträge zählen nicht. Im Duell (2 Spieler) automatisch; bei mehr Spielern manuell.",
  },
  yatzyStreak3: {
    key: "yatzyStreak3",
    title: "3× Alle Fünfe",
    body:
      "Trägst du drei echte Alle Fünfe (je 50 Punkte) hintereinander mit höchstens 3 Würfen ein, verliert der Gegner seinen gesamten Pool. Null-Einträge zählen nicht. Im Duell automatisch. Hat Vorrang vor der 2×-Strafe.",
  },
  upperRace: {
    key: "upperRace",
    title: "Oberer Bereich zuerst",
    body:
      "Wer zuerst alle oberen Felder über alle Spiele voll hat (Anzahl Spiele × 6), erhält so viele Pool-Würfe, wie der Rivale oben noch offen hat. Nur Duell, nur einmal pro Partie.",
  },
  columnPoolBonuses: {
    key: "columnPoolBonuses",
    title: "Spalten-Pool-Boni",
    body:
      "Nur Strategy. Der erste Spieler in der Session erhält je einmalig +2 Pool: (A) eine Spalte 1–6 voll mit Bonus (+35), (B) eine Spalte unten komplett (7 Felder), (C) beides in derselben Spalte. Maximum 6 Pool. Unabhängig von „Oberer Bereich zuerst“.",
  },
};

export function getHouseRuleInfo(key: string | undefined): HouseRuleInfo | null {
  if (!key) return null;
  return HOUSE_RULE_INFO[key as HouseRuleInfoKey] ?? null;
}
