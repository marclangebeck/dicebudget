export type AppTourChapterId = "start" | "strategy" | "rivals";

export type AppTourStep = {
  id: string;
  chapter: AppTourChapterId;
  title: string;
  body: string;
  /** Optionaler CSS-Selektor für Spotlight auf dem Startscreen. */
  anchor?: string;
};

export type AppTourChapterMeta = {
  id: AppTourChapterId;
  /** Kurzlabel in der Fortschrittszeile */
  label: string;
  /** Titel für Einstellungen / CTAs */
  title: string;
  /** Nächstes Kapitel in der Kette (Auto-Tour), sonst null */
  next: AppTourChapterId | null;
};

export const APP_TOUR_CHAPTERS: AppTourChapterMeta[] = [
  {
    id: "start",
    label: "Start",
    title: "Start & Navigation",
    next: "strategy",
  },
  {
    id: "strategy",
    label: "Strategy",
    title: "Strategy & Pool",
    next: "rivals",
  },
  {
    id: "rivals",
    label: "Rivalen",
    title: "Statistik & Rivalen",
    next: null,
  },
];

export const APP_TOUR_CHAPTER_ORDER: AppTourChapterId[] = APP_TOUR_CHAPTERS.map(
  (chapter) => chapter.id,
);

/** Kapitel A — Startscreen / Navigation */
export const APP_TOUR_STEPS_START: AppTourStep[] = [
  {
    id: "welcome",
    chapter: "start",
    title: "Willkommen bei dice.budget",
    body: "Kurze Tour in drei Kapiteln: Start, Strategy (Pool) und Rivalen. Jederzeit überspringbar — über das Menü erneut startbar.",
  },
  {
    id: "host",
    chapter: "start",
    title: "Multi-Spiel als Host",
    body: "Oben startest du einen Raum: Spielanzahl und Regeln festlegen, Code teilen, Gegner einladen.",
    anchor: '[data-tour-anchor="host"]',
  },
  {
    id: "join",
    chapter: "start",
    title: "Mit Code beitreten",
    body: "Kennst du den Code vom Host? Hier direkt eingeben und der Lobby beitreten — ohne Umweg.",
    anchor: '[data-tour-anchor="join"]',
  },
  {
    id: "solo",
    chapter: "start",
    title: "Solo-Run",
    body: "Allein üben oder eine Runde Strategy spielen — gleicher Zettel, dein Tempo.",
    anchor: '[data-tour-anchor="solo"]',
  },
];

/** Kapitel B — Abweichungen zum klassischen Würfeln ohne Pool */
export const APP_TOUR_STEPS_STRATEGY: AppTourStep[] = [
  {
    id: "strategy-vs-classic",
    chapter: "strategy",
    title: "Klassisch vs. Strategy",
    body: "Klassisch: pro Feld 1–3 Würfe, dann eintragen — fertig. Strategy: dieselben 3 Würfe sind ein Budget; Reste und Extra-Würfe laufen über den Pool.",
  },
  {
    id: "budget-3",
    chapter: "strategy",
    title: "Drei Würfe als Budget",
    body: "Pro Feld hast du bis zu drei Würfe. Du musst sie nicht alle nutzen — oft ist früh eintragen die bessere Entscheidung.",
  },
  {
    id: "pool-build",
    chapter: "strategy",
    title: "Pool aufbauen",
    body: "Jeden ungenutzten Wurf legst du in den Pool. Sparst du oft, hast du später Reserven für schwierige Felder.",
  },
  {
    id: "pool-spend",
    chapter: "strategy",
    title: "Extra-Würfe aus dem Pool",
    body: "Wurf 4 und jeder weitere kosten Pool. Ohne Pool kein Extra-Wurf — deshalb planst du Budget und Risiko über die ganze Partie.",
  },
  {
    id: "pool-planning",
    chapter: "strategy",
    title: "Bonus & Alle Fünfe planen",
    body: "Strategy belohnt Weitsicht: Bonus in der oberen Hälfte und Alle Fünfe hängen oft davon ab, ob du Pool für den richtigen Moment aufgehoben hast.",
  },
  {
    id: "opponent-pool",
    chapter: "strategy",
    title: "Gegner-Pool (optional)",
    body: "In den Einstellungen kannst du den Pool der Gegner sichtbar machen — nützlich fürs Timing, kein Muss.",
  },
  {
    id: "pool-endgame",
    chapter: "strategy",
    title: "Pool-Endspiel (optional)",
    body: "Wenn aktiv: Nach allen Einträgen darf der Spieler mit dem klar größten Pool noch ein Feld verbessern. Bei Gleichstand verbessert niemand.",
  },
  {
    id: "house-rules",
    chapter: "strategy",
    title: "InApp-Käufe (Features)",
    body: "Optional freischaltbar: Brennt (−1/−2 Pool), Wurf verkaufen, 2× Alle Fünfe und mehr. Weitere Features kommen später — die Vorschau hält sie testbar, bevor sie für alle verfügbar sind.",
  },
];

/** Kapitel C — Statistik & Rivalen */
export const APP_TOUR_STEPS_RIVALS: AppTourStep[] = [
  {
    id: "stats-overview",
    chapter: "rivals",
    title: "Statistik & Meine Rivalen",
    body: "Unter Statistik siehst du Bilanz, Siegquote und Duelle. Gegner erscheinen als „Meine Rivalen“ — mit Namen, die nur du vergibst.",
  },
  {
    id: "rivals-local",
    chapter: "rivals",
    title: "Nur auf diesem Gerät",
    body: "Rivalen-Namen sind lokal. Der Server kennt nur pseudonyme IDs — deine Namen werden nicht hochgeladen.",
  },
  {
    id: "rivals-after-game",
    chapter: "rivals",
    title: "Nach dem Spiel benennen",
    body: "Unbekannte Gegner: neuen Namen vergeben oder mit einem bestehenden Rivalen verknüpfen. So bleiben Aliase und Statistik sauber.",
  },
  {
    id: "rivals-manage",
    chapter: "rivals",
    title: "Rivalen verwalten",
    body: "Über das Menü → Rivalen verwalten: anlegen, umbenennen, zusammenführen oder löschen. Von der Statistik gibt es einen Direktlink.",
  },
];

export const APP_TOUR_STEPS_BY_CHAPTER: Record<AppTourChapterId, AppTourStep[]> = {
  start: APP_TOUR_STEPS_START,
  strategy: APP_TOUR_STEPS_STRATEGY,
  rivals: APP_TOUR_STEPS_RIVALS,
};

/** Alle Schritte in Kapitel-Reihenfolge (Tests / Übersicht). */
export const APP_TOUR_STEPS: AppTourStep[] = [
  ...APP_TOUR_STEPS_START,
  ...APP_TOUR_STEPS_STRATEGY,
  ...APP_TOUR_STEPS_RIVALS,
];

export function getAppTourChapterMeta(id: AppTourChapterId): AppTourChapterMeta {
  const meta = APP_TOUR_CHAPTERS.find((chapter) => chapter.id === id);
  if (!meta) throw new Error(`Unbekanntes Tour-Kapitel: ${id}`);
  return meta;
}

export function getAppTourSteps(chapter: AppTourChapterId): AppTourStep[] {
  return APP_TOUR_STEPS_BY_CHAPTER[chapter];
}

export function parseAppTourChapterParam(raw: string | null): AppTourChapterId | "all" | null {
  if (!raw) return null;
  if (raw === "1" || raw === "all") return "all";
  if (raw === "start" || raw === "strategy" || raw === "rivals") return raw;
  return null;
}

export function nextAppTourChapter(id: AppTourChapterId): AppTourChapterId | null {
  return getAppTourChapterMeta(id).next;
}
