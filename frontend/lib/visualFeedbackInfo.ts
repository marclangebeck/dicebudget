export type VisualFeedbackInfoKey = "animations" | "sounds" | "progress";

export type VisualFeedbackInfo = {
  key: VisualFeedbackInfoKey;
  title: string;
  body: string;
};

export const VISUAL_FEEDBACK_INFO: Record<VisualFeedbackInfoKey, VisualFeedbackInfo> = {
  animations: {
    key: "animations",
    title: "Erfolgsanimationen",
    body:
      "Nach besonderen Einträgen erscheint kurz ein Overlay: oberer Bonus, komplette untere Spalte, Große Straße oder Alle Fünfe. Rein optisch — am Spielstand ändert sich nichts.",
  },
  sounds: {
    key: "sounds",
    title: "Sounds",
    body:
      "Kurze akustische Hinweise zu Erfolgsanimationen und Fortschritts-Meilensteinen. Ohne Ton bleiben die visuellen Overlays unverändert (falls aktiv).",
  },
  progress: {
    key: "progress",
    title: "Fortschritt (25 / 50 / 75 %)",
    body:
      "Sobald du etwa ein Viertel, die Hälfte oder drei Viertel aller Felder eingetragen hast, erscheint ein Zwischenstand. Im Multi zeigt er, wie viele Feldpunkte du vor dem Rivalen liegst oder zurück bist — ohne oberen Bonus und ohne Extra-Yatzy.",
  },
};

export function getVisualFeedbackInfo(
  key: VisualFeedbackInfoKey,
): VisualFeedbackInfo {
  return VISUAL_FEEDBACK_INFO[key];
}
