import { CONTACT_EMAIL } from "@/lib/branding";

/** Freigegebene Soft-Launch-Copy (Positionierung D) — LP + Meta. */
export const DICEBUDGET_MARKETING = {
  eyebrow: "DiceBudget · Strategy Edition",
  headline: "Echte Würfel. Echte Taktik. Eure Serie.",
  lead:
    "Du würfelst am Tisch. Die App gibt dir ein Wurf-Budget, zählt fair und merkt sich eure Stammrunde.",
  support: "Kein Würfelspiel in der App — nur der digitale Zettel.",
  trust: "Einmal 1,17 € · werbefrei · ohne Kern-In-App-Käufe",
  priceNote:
    "Regionale Apple-Preise können abweichen — maßgeblich ist der Preis im App Store.",
  statusLine: "Beta / TestFlight — App Store folgt",
  strategy: {
    id: "pool",
    title: "Wurf-Pool: Mehr Taktik für deine Runde",
    text: "Ungenutzte Würfe werden zum Budget. Du planst Bonus, Alle Fünfe und Timing — die Würfel bleiben echt.",
    micro:
      "Strategy Edition ist der Standard. Klassisch ohne Pool gibt’s weiterhin — gleiche Wertung.",
  },
  stammrunde: {
    title: "Nicht nur eine Runde — eure Serie",
    text:
      "2–6 Spieler per QR oder Link — alternativ per Raumcode, wenn kein Scan möglich. Serien, Paarungsstatistik und Verlauf für Freundes-, Paar- und Familienrunden. Auf dem iPad: Tischmodus mit zwei Zetteln auf einem Gerät.",
  },
  paid: {
    title: "Einmal kaufen. Fertig spielen.",
    text: "1,17 €. Werbefrei. Strategy und Klassisch ohne In-App-Kauf-Zwang. Kein Account.",
  },
  faq: {
    title: "Häufige Fragen",
    items: [
      {
        question: "Würfelt die App für mich?",
        answer:
          "Nein. DiceBudget ist der digitale Zettel. Ihr würfelt mit echten Würfeln am Tisch.",
      },
      {
        question: "Brauche ich Internet?",
        answer:
          "Solo weitgehend lokal auf dem Gerät. Gemeinsame Runden brauchen eine Verbindung zu unserem Server.",
      },
      {
        question: "Was bedeutet „Alle Fünfe“?",
        answer:
          "So heißt in der App die Zeile für fünf Gleiche. Kein Markenname eines anderen Herstellers.",
      },
      {
        question: "Warum nicht nur ein Browser-Block?",
        answer:
          "Strategy-Pool, Serien und Paarungsstatistik, native iOS inkl. Tischmodus, einmaliger Kauf ohne Werbung und ohne Kern-In-App-Käufe.",
      },
      {
        question: "Was ist die Strategy Edition?",
        answer:
          "Der Standardmodus mit Wurf-Pool: Ungenutzte Würfe werden zum Budget für später. So planst du Bonus, Alle Fünfe und Timing — mehr Taktik in jeder Runde. Es gibt auch Klassisch ohne Pool, gleiche Wertung.",
      },
      {
        question: "Wie kommen Mitspieler dazu?",
        answer:
          "Am einfachsten: Der Host teilt einen QR-Code oder Link. Alternative: Mitspieler können auch per Raumcode beitreten („Code teilen“ / „Code eingeben“) — praktisch, wenn die Kamera oder der QR-Scan nicht geht.",
      },
      {
        question: "Wie viele Spieler?",
        answer:
          "Solo oder 2–6. Auf dem iPad gibt es einen Tischmodus mit zwei Zetteln auf einem Gerät.",
      },
      {
        question: "Kostet die App etwas?",
        answer:
          "Einmalig 1,17 €, werbefrei, ohne Kern-In-App-Käufe für Strategy und Klassisch. Regionale Apple-Preise können abweichen — maßgeblich ist der Preis im App Store.",
      },
    ],
  },
  cta: {
    betaLabel: "Als Beta testen",
    poolLabel: "So funktioniert der Pool",
    poolHref: "#pool",
    webAppLabel: "In der Web-App öffnen",
  },
} as const;

export const DICEBUDGET_BETA_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("DiceBudget Beta")}&body=${encodeURIComponent("Hallo,\n\nich möchte DiceBudget in der Beta testen.\n\nE-Mail:\n\nViele Grüße")}`;
