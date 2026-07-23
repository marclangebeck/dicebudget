export type AppTourStep = {
  id: string;
  title: string;
  body: string;
  /** Optionaler CSS-Selektor für Spotlight auf dem Startscreen. */
  anchor?: string;
};

/** Geführte Kurz-Tour — inklusive Pool-Erklärung. */
export const APP_TOUR_STEPS: AppTourStep[] = [
  {
    id: "welcome",
    title: "Willkommen bei dice.budget",
    body: "Kurz-Tour durch die wichtigsten Bereiche. Du kannst jederzeit überspringen — und unter Einstellungen erneut starten.",
  },
  {
    id: "host",
    title: "Multi-Spiel als Host",
    body: "Oben startest du einen Raum: Spielanzahl und Regeln festlegen, Code teilen, Gegner einladen.",
    anchor: '[data-tour-anchor="host"]',
  },
  {
    id: "join",
    title: "Mit Code beitreten",
    body: "Kennst du den Code vom Host? Hier direkt eingeben und der Lobby beitreten — ohne Umweg.",
    anchor: '[data-tour-anchor="join"]',
  },
  {
    id: "solo",
    title: "Solo-Run",
    body: "Allein üben oder eine Runde Strategy spielen — gleicher Zettel, dein Tempo.",
    anchor: '[data-tour-anchor="solo"]',
  },
  {
    id: "pool",
    title: "Der Wurf-Pool (Strategy)",
    body: "Pro Feld hast du bis zu 3 Würfe. Weniger genutzt → Rest landet im Pool. Extra-Würfe (4+) kosten Pool. So planst du Bonus und Alle Fünfe über die ganze Partie.",
  },
  {
    id: "settings",
    title: "Einstellungen",
    body: "Spielmodus, Feedback, Multi-Defaults und Hausregeln (z. B. Brennt) stellst du zentral ein. Hausregeln gelten im Labor noch pro Gerät.",
  },
  {
    id: "stats",
    title: "Statistik & Rivalen",
    body: "Unter Statistik siehst du deine Bilanz und Duelle. Rivalen kannst du lokal benennen — nur auf diesem Gerät, der Server bleibt pseudonym.",
  },
];
