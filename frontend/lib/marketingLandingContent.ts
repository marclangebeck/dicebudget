import { APP_HOME_PATH, IMPRESSUM_PATH, PRIVACY_PATH, SITE_URL } from "@/lib/branding";

/** Marketing-LP dicebudget.bottle-trade.de — Copy & Struktur (Addendum-konform). */
export const MARKETING_LANDING = {
  hero: {
    eyebrow: "DiceBudget · Strategy Edition",
    headline: "Echte Würfel. Echte Taktik. Eure Serie.",
    lead:
      "Am Tisch würfelt ihr physisch — DiceBudget hält Punkte, Pool und Serie digital fest. Solo oder mit 2–6 Spielern.",
    supportLine:
      "Nie wieder Zettel suchen: würfeln wie gewohnt, Einträge direkt auf dem iPhone.",
    trustPrice: "Einmalig ca. 1,17 € im App Store.",
    priceNote: "Maßgeblich sind Preis und Verfügbarkeit im App Store zum Release.",
    primaryCta: { label: "Zur App", href: APP_HOME_PATH },
    secondaryCta: { label: "So funktioniert der Pool", href: "#pool" },
    statusLine: "Beta · noch nicht im öffentlichen App Store",
  },
  strategy: {
    id: "pool",
    title: "Strategy Edition — Wurf-Pool mitdenken",
    paragraphs: [
      "Pro Feld habt ihr bis zu drei Würfe ohne Pool. Spart ihr Würfe ein oder nutzt ihr Extra-Würfe, landet das im Wurf-Pool — sichtbar für alle in der Runde.",
      "So bleibt Taktik am Tisch: wer sparsam würfelt, gewinnt Spielraum für spätere Felder. Klassischer Modus ohne Pool ist weiterhin wählbar.",
    ],
    bullets: [
      "1–6 Spielblöcke pro Partie — vor Start festlegen",
      "Strategy Edition (Standard) oder DiceBudget Klassisch",
      "Serien über mehrere Abende mit eurer Gruppe",
    ],
  },
  stammrunde: {
    title: "Eure Stammrunde",
    paragraphs: [
      "Host startet in der App einen Raum und teilt Link oder QR — Mitspieler sind in Sekunden dabei.",
      "Geht es schnell: Raumcode in der App eingeben (mindestens 6 Zeichen).",
    ],
    joinUrl: `${SITE_URL}/multi/join`,
    joinLinkLabel: "Beitrittsseite öffnen",
  },
  paid: {
    title: "Ein Preis, keine Abos",
    priceLine: "Geplant: einmalig ca. 1,17 € im Apple App Store.",
    note: "Kein Abo, keine Werbung. In der Beta testest du die Web-App unter dieser Domain kostenlos.",
  },
  faq: {
    title: "Häufige Fragen",
    items: [
      {
        question: "Würfelt die App für mich?",
        answer:
          "Nein. Ihr würfelt physisch am Tisch. DiceBudget ist der digitale Zettel — Einträge, Summen und Pool.",
      },
      {
        question: "Was ist der Wurf-Pool?",
        answer:
          "In der Strategy Edition sammeln ungenutzte oder extra verbrauchte Würfe im Pool. Er beeinflusst, wie viele Würfe ihr später noch nutzen könnt.",
      },
      {
        question: "Wie trete ich einer Runde bei?",
        answer:
          "Link oder QR vom Host öffnen — oder in der App den Raumcode eingeben. Pseudonym, ohne E-Mail-Konto.",
      },
      {
        question: "Was kostet DiceBudget?",
        answer:
          "Zielpreis einmalig ca. 1,17 € im App Store. Endgültiger Preis und Release stehen bei Apple; die Beta-Web-App bleibt zum Testen kostenlos.",
      },
    ],
  },
  footer: {
    privacyHref: PRIVACY_PATH,
    impressumHref: IMPRESSUM_PATH,
  },
} as const;
