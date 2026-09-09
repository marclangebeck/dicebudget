export type HouseRuleInfoKey =
  | "burn"
  | "rollSale"
  | "yatzyStreak2"
  | "yatzyStreak2Credit"
  | "yatzyStreak3"
  | "yatzyStreak3Credit"
  | "upperRace"
  | "columnPoolBonuses"
  | "yatzyEfficiency";

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
      "Wenn ein Würfel am Tisch „brennt“ (z. B. vom Tisch): Neu würfeln kostet 1 Pool — nur der brennende Würfel wird nochmal geworfen, die anderen dürfen liegen bleiben. Augenzahl selbst setzen (Würfel daneben legen) kostet 2 Pool. Nur am Anfang eines leeren Feldes, nicht bei Korrekturen.",
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
      "Trägst du zwei echte Alle Fünfe (je 50 Punkte) hintereinander mit höchstens 3 Würfen ein, verlieren alle Mitspieler ohne diesen Streak 1/n ihres Pools (n = Spielerzahl; zu zweit die Hälfte, zu dritt ein Drittel, …; abgerundet). Null-Einträge zählen nicht. Im Multi automatisch. Optional: Pool-Gutschrift an dich.",
  },
  yatzyStreak2Credit: {
    key: "yatzyStreak2Credit",
    title: "2× Alle Fünfe — Pool-Gutschrift",
    body:
      "Wenn aktiv: Die Pools, die den Mitspielern durch 2× Alle Fünfe abgezogen werden, erhält der Erfolgreiche gutgeschrieben (Transfer). Standard aus — dann bleibt es bei der reinen Strafe.",
  },
  yatzyStreak3: {
    key: "yatzyStreak3",
    title: "3× Alle Fünfe",
    body:
      "Trägst du drei echte Alle Fünfe (je 50 Punkte) hintereinander mit höchstens 3 Würfen ein, verlieren alle Mitspieler ihren gesamten Pool. Null-Einträge zählen nicht. Im Multi automatisch. Hat Vorrang vor der 2×-Strafe. Optional: Pool-Gutschrift an dich.",
  },
  yatzyStreak3Credit: {
    key: "yatzyStreak3Credit",
    title: "3× Alle Fünfe — Pool-Gutschrift",
    body:
      "Wenn aktiv: Die Pools, die den Mitspielern durch 3× Alle Fünfe abgezogen werden, erhält der Erfolgreiche gutgeschrieben (Transfer). Standard aus — dann bleibt es bei der reinen Strafe.",
  },
  upperRace: {
    key: "upperRace",
    title: "Oberer Bereich zuerst",
    body:
      "Wer zuerst alle oberen Felder über alle Spiele voll hat (Anzahl Spiele × 6), erhält so viele Pool-Würfe, wie die Mitspieler oben zusammen noch offen haben (zu zweit: der eine Rivale). Nur einmal pro Partie.",
  },
  columnPoolBonuses: {
    key: "columnPoolBonuses",
    title: "Spalten-Pool-Boni",
    body:
      "Nur Strategy. Der erste Spieler in der Session erhält je einmalig +2 Pool: (A) eine Spalte 1–6 voll mit Bonus (+35), (B) eine Spalte unten komplett (7 Felder), (C) beides in derselben Spalte. Maximum 6 Pool. Unabhängig von „Oberer Bereich zuerst“.",
  },
  yatzyEfficiency: {
    key: "yatzyEfficiency",
    title: "Alle Fünfe: Effizienz",
    body:
      "Nur Strategy. Bei Alle Fünfe zählen die Würfe auf diesem Feld: bis einschließlich Wurf 7 gibt es volle 50 Punkte. Ab Wurf 8 sinkt der Trefferwert alle 3 Würfe um 5 Punkte (10 % vom Ausgangswert 50), z. B. 8–10 → 45, 11–13 → 40. Ohne Treffer weiterhin 0. Toggle aus = wie bisher immer 50. Zusatz-Alle-Fünfe (+100) und 2×/3×-Strafen (nur echte 50 mit ≤3 Würfen) bleiben unverändert.",
  },
};

export function getHouseRuleInfo(key: string | undefined): HouseRuleInfo | null {
  if (!key) return null;
  return HOUSE_RULE_INFO[key as HouseRuleInfoKey] ?? null;
}
