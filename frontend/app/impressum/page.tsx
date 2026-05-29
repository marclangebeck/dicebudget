import type { Metadata } from "next";
import Link from "next/link";
import { BackToHome } from "@/components/BackToHome";
import {
  APP_HOME_PATH,
  APP_NAME,
  CONTACT_EMAIL,
  IMPRESSUM_URL,
  PRIVACY_PATH,
  SITE_URL,
} from "@/lib/branding";
import {
  LEGAL_PHONE_DISPLAY,
  LEGAL_PHONE_TEL,
  LEGAL_PROVIDER,
  formatLegalAddress,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: `Impressum — ${APP_NAME}`,
  description: `Impressum für ${APP_NAME}`,
  alternates: { canonical: IMPRESSUM_URL },
};

export default function ImpressumPage() {
  const address = formatLegalAddress();

  return (
    <main className="legal-page">
      <article className="legal-article">
        <header className="legal-header">
          <BackToHome className="app-nav-btn--header" />
          <h1>Impressum</h1>
          <p className="legal-meta">
            Angaben gemäß § 5 DDG sowie § 18 Abs. 2 MStV
          </p>
        </header>

        <section>
          <h2>Diensteanbieter</h2>
          <p>
            {LEGAL_PROVIDER.name}
            <br />
            {address}
          </p>
          <p>
            Die App <strong>{APP_NAME}</strong> wird im Rahmen des Projekts{" "}
            <strong>bottle-trade.de</strong> betrieben.
          </p>
        </section>

        <section>
          <h2>Kontakt</h2>
          <p>
            E-Mail:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            Telefon: <a href={`tel:${LEGAL_PHONE_TEL}`}>{LEGAL_PHONE_DISPLAY}</a>
          </p>
          <p>
            Website: <a href={SITE_URL}>{SITE_URL.replace(/^https:\/\//, "")}</a>
          </p>
        </section>

        <section>
          <h2>Vertretungsberechtigte Person</h2>
          <p>{LEGAL_PROVIDER.name}</p>
        </section>

        <section>
          <h2>Inhaltlich verantwortlich</h2>
          <p>
            Verantwortlich für journalistisch-redaktionelle Inhalte nach § 18
            Abs. 2 MStV: {LEGAL_PROVIDER.name}, {address}
          </p>
        </section>

        <section>
          <h2>Haftung für Inhalte</h2>
          <p>
            Die Inhalte dieser App und Website wurden mit Sorgfalt erstellt.
            Eine Gewähr für Richtigkeit, Vollständigkeit und Aktualität wird
            jedoch nicht übernommen.
          </p>
        </section>

        <section>
          <h2>Haftung für Links</h2>
          <p>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine
            Haftung für die Inhalte externer Links. Für den Inhalt der
            verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
          </p>
        </section>

        <section>
          <h2>Urheberrecht</h2>
          <p>
            Die durch die Betreiber erstellten Inhalte und Werke in dieser App
            und auf diesen Seiten unterliegen dem deutschen Urheberrecht.
          </p>
        </section>

        <footer className="legal-footer">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={APP_HOME_PATH} className="legal-footer-cta">
              Zur App
            </Link>
            <Link href={PRIVACY_PATH} className="legal-footer-cta">
              Datenschutz
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
