import type { Metadata } from "next";
import Link from "next/link";
import {
  APP_HOME_PATH,
  APP_NAME,
  PRIVACY_EMAIL,
  PRIVACY_URL,
  SITE_URL,
} from "@/lib/branding";

export const metadata: Metadata = {
  title: `Datenschutzerklärung — ${APP_NAME}`,
  description: `Datenschutzerklärung für ${APP_NAME} (Web-App und geplante iOS-App)`,
  alternates: { canonical: PRIVACY_URL },
};

export default function DatenschutzPage() {
  return (
    <main className="legal-page pt-safe pb-safe">
      <article className="legal-article">
        <header className="legal-header">
          <Link href="/" className="legal-back">
            ← {APP_NAME}
          </Link>
          <h1>Datenschutzerklärung</h1>
          <p className="legal-meta">
            Stand: Mai 2026 · Gültig für die Web-App unter{" "}
            <a href={SITE_URL}>{SITE_URL.replace(/^https:\/\//, "")}</a> und die
            geplante iOS-App „{APP_NAME}“
          </p>
        </header>

        <section>
          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung im Sinne der
            Datenschutz-Grundverordnung (DSGVO) ist der Betreiber der App{" "}
            <strong>{APP_NAME}</strong> (nachfolgend „wir“).
          </p>
          <p>
            Kontakt für Datenschutzanfragen:{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
          </p>
        </section>

        <section>
          <h2>2. Überblick</h2>
          <p>
            {APP_NAME} ist ein Würfelspiel (Yatzy-Variante) als Web-App. Es gibt
            <strong> kein Benutzerkonto</strong> und keine Registrierung mit
            E-Mail-Adresse. Du kannst im Browser spielen oder die App zum
            Startbildschirm hinzufügen; eine native iOS-Version ist geplant.
          </p>
          <p>
            Für Spielstände und Multiplayer ist eine Verbindung zu unserem
            Server erforderlich.
          </p>
        </section>

        <section>
          <h2>3. Welche Daten wir verarbeiten</h2>

          <h3>3.1 Spielen im Browser (Einzelspiel)</h3>
          <p>
            Beim Solo-Spiel speichern wir auf dem Server deinen Spielstand
            (Punkte, Felder, Modus, Spielanzahl). Es wird kein Name abgefragt.
            Lokal im Browser kann ein Hinweis auf das laufende Spiel in{" "}
            <code>sessionStorage</code> liegen, damit du nach einem Seitenwechsel
            weiterspielen kannst.
          </p>

          <h3>3.2 Multiplayer</h3>
          <p>
            Wenn du einem Raum beitrittst, gibst du einen <strong>Spielernamen</strong>{" "}
            ein. Dieser Name, dein Punktestand und technische Zuordnungen (z. B.
            Einladungscode, geheimer Spieler-Schlüssel) werden auf dem Server
            gespeichert, solange die Runde bzw. Serie relevant ist.
          </p>
          <p>
            Der geheime Schlüssel (<code>playerSecret</code>) wird in deinem
            Browser in <code>sessionStorage</code> abgelegt — nicht in einem
            Konto auf unserer Seite. Wechselst du das Gerät, musst du den Raum
            erneut über den Code betreten.
          </p>

          <h3>3.3 Statistik</h3>
          <p>
            Abgeschlossene Spiele können in aggregierter Statistik erscheinen
            (z. B. persönliche Rekorde, Paarungsvergleiche zwischen Spielernamen
            aus Multiplayer-Runden). Du kannst Spielernamen in der App
            zusammenführen; dabei werden Alias-Zuordnungen auf dem Server
            gespeichert.
          </p>

          <h3>3.4 Technische Daten</h3>
          <p>
            Beim Aufruf der Website und der API können Server- und
            Zugriffsprotokolle (z. B. IP-Adresse, Zeitpunkt, angeforderte URL,
            User-Agent) durch den Hosting-Anbieter und unsere Infrastruktur
            anfallen — zur Sicherheit und Fehleranalyse.
          </p>
        </section>

        <section>
          <h2>4. Was wir nicht tun</h2>
          <ul>
            <li>Kein Verkauf deiner Daten an Dritte</li>
            <li>Keine Werbe-Tracker oder Social-Media-Pixel in der App</li>
            <li>Kein Newsletter und keine Pflicht-E-Mail bei der Nutzung</li>
            <li>Keine standortbasierte Tracking-Profile</li>
          </ul>
        </section>

        <section>
          <h2>5. Rechtsgrundlagen</h2>
          <p>
            Die Verarbeitung erfolgt zur Bereitstellung der App und
            Erfüllung des Spielvertrags mit dir (Art. 6 Abs. 1 lit. b DSGVO)
            sowie auf Basis unseres berechtigten Interesses an einem sicheren,
            stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </section>

        <section>
          <h2>6. Speicherdauer</h2>
          <p>
            Spiel- und Session-Daten bleiben gespeichert, solange sie für
            laufende oder ausgewertete Partien benötigt werden. Abgeschlossene
            Runs und Statistikwerte können länger gespeichert bleiben, damit
            Rekorde und Paarungsauswertungen funktionieren. Du kannst uns
            unter der oben genannten E-Mail-Adresse um Auskunft oder Löschung
            bitten, soweit keine gesetzlichen Aufbewahrungspflichten
            entgegenstehen.
          </p>
        </section>

        <section>
          <h2>7. Hosting und Auftragsverarbeitung</h2>
          <p>
            Die Anwendung wird auf Servern im Rahmen des Projekts betrieben
            (Domain <strong>dicebudget.bottle-trade.de</strong>). Mit dem
            Hosting-Anbieter bestehen die üblichen technischen Zugriffe; eine
            Verarbeitung kann in der EU bzw. im EWR erfolgen.
          </p>
        </section>

        <section>
          <h2>8. Deine Rechte</h2>
          <p>Du hast nach der DSGVO insbesondere das Recht auf:</p>
          <ul>
            <li>Auskunft über gespeicherte Daten</li>
            <li>Berichtigung unrichtiger Daten</li>
            <li>Löschung („Recht auf Vergessenwerden“), soweit zulässig</li>
            <li>Einschränkung der Verarbeitung</li>
            <li>Widerspruch gegen Verarbeitung aus berechtigtem Interesse</li>
            <li>Beschwerde bei einer Aufsichtsbehörde</li>
          </ul>
          <p>
            Wende dich dazu an{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2>9. Kinder</h2>
          <p>
            Die App richtet sich nicht gezielt an Kinder unter 16 Jahren. Wenn
            du als Erziehungsberechtigte oder Erziehungsberechtigter von
            Datenverarbeitung bei Minderjährigen Kenntnis erhältst, kontaktiere
            uns bitte.
          </p>
        </section>

        <section>
          <h2>10. Änderungen</h2>
          <p>
            Wir können diese Erklärung anpassen, wenn sich die App oder
            rechtliche Anforderungen ändern. Die aktuelle Fassung ist unter{" "}
            <a href={PRIVACY_URL}>{PRIVACY_URL.replace(/^https:\/\//, "")}</a>{" "}
            abrufbar.
          </p>
        </section>

        <footer className="legal-footer">
          <Link href={APP_HOME_PATH} className="legal-footer-cta">
            Zur App
          </Link>
        </footer>
      </article>
    </main>
  );
}
