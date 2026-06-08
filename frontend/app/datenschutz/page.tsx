import type { Metadata } from "next";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import {
  APP_NAME,
  CONTACT_EMAIL,
  PRIVACY_URL,
  SITE_URL,
} from "@/lib/branding";
import {
  HOSTING,
  LEGAL_DATA_PROTECTION_OFFICER,
  LEGAL_PROVIDER,
  formatLegalAddress,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: `Datenschutzerklärung — ${APP_NAME}`,
  description: `Datenschutzerklärung für ${APP_NAME} (app-zentrierte Nutzung)`,
  alternates: { canonical: PRIVACY_URL },
};

export default function DatenschutzPage() {
  const address = formatLegalAddress();

  return (
    <main className="legal-page">
      <AppScreenHeader
        section="Datenschutz"
        title="Datenschutz"
        subtitle={`Stand: Mai 2026 · App und Website ${SITE_URL.replace(/^https:\/\//, "")}`}
      />
      <article className="legal-article">
        <section>
          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung im Sinne der
            Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p>
            <strong>{LEGAL_PROVIDER.name}</strong>
            <br />
            {address}
            <br />
            E-Mail:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            Die App <strong>{APP_NAME}</strong> wird im Rahmen des Projekts{" "}
            <strong>bottle-trade.de</strong> betrieben.
          </p>
        </section>

        <section>
          <h2>2. Datenschutzbeauftragter</h2>
          <p>
            Datenschutzbeauftragter: <strong>{LEGAL_DATA_PROTECTION_OFFICER}</strong>
            <br />
            Erreichbar unter{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </section>

        <section>
          <h2>3. Überblick</h2>
          <p>
            {APP_NAME} ist ein Würfelspiel mit
            app-zentrierter Nutzung. Es gibt
            <strong> kein Benutzerkonto</strong> und keine Registrierung mit
            E-Mail-Adresse.
          </p>
          <p>
            Die Website dient primär als Informations-, Support- und
            Datenschutzseite. Für Multiplayer und Statistik ist eine Verbindung
            zu unserem Server erforderlich.
          </p>
        </section>

        <section>
          <h2>4. Welche Daten wir verarbeiten</h2>

          <h3>4.1 Einzelspiel (lokal auf dem Gerät)</h3>
          <p>
            Beim Solo-Spiel speichert die App den Spielstand lokal auf deinem
            Gerät (z. B. Punkte, Felder, Modus, Spielanzahl). Es wird kein Name
            abgefragt und keine Solo-Statistik serverseitig persistiert.
          </p>

          <h3>4.2 Multiplayer</h3>
          <p>
            Multiplayer-Daten werden pseudonym verarbeitet. Beim ersten Start
            erzeugt die App lokal eine zufällige Spieler-ID. Auf dem Server
            speichern wir für Multiplayer keine Klarnamen, sondern nur diese
            pseudonyme ID sowie Spielwerte (z. B. Punkte, Sieger, Zeitstempel,
            Einladungscode, geheimer Spieler-Schlüssel).
          </p>
          <p>
            Der geheime Schlüssel (<code>playerSecret</code>) wird in deinem
            App-WebView lokal gespeichert (technisch analog zu{" "}
            <code>sessionStorage</code>) — nicht in einem Konto auf unserer
            Seite. Wechselst du das Gerät, musst du den Raum erneut über den
            Code betreten.
          </p>

          <h3>4.3 Statistik</h3>
          <p>
            Abgeschlossene Multiplayer-Spiele können in aggregierter Statistik
            erscheinen (z. B. Paarungsvergleiche zwischen pseudonymen
            Spieler-IDs aus Multiplayer-Runden). Lesbare Anzeigenamen können
            lokal auf dem Gerät verwaltet werden.
          </p>

          <h3>4.4 Technische Daten</h3>
          <p>
            Beim Aufruf der App-API und der Website können Server- und
            Zugriffsprotokolle (z. B. IP-Adresse, Zeitpunkt, angeforderte URL,
            User-Agent) durch den Hosting-Anbieter und unsere Infrastruktur
            anfallen — zur Sicherheit und Fehleranalyse.
          </p>
        </section>

        <section>
          <h2>5. Was wir nicht tun</h2>
          <ul>
            <li>Kein Verkauf deiner Daten an Dritte</li>
            <li>Keine Werbe-Tracker oder Social-Media-Pixel in der App</li>
            <li>Kein Newsletter und keine Pflicht-E-Mail bei der Nutzung</li>
            <li>Keine standortbasierte Tracking-Profile</li>
          </ul>
        </section>

        <section>
          <h2>6. Rechtsgrundlagen</h2>
          <p>
            Die Verarbeitung erfolgt zur Bereitstellung der App und
            Erfüllung des Spielvertrags mit dir (Art. 6 Abs. 1 lit. b DSGVO)
            sowie auf Basis unseres berechtigten Interesses an einem sicheren,
            stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </section>

        <section>
          <h2>7. Speicherdauer</h2>
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
          <h2>8. Hosting und Auftragsverarbeitung</h2>
          <p>
            Die Anwendung wird von <strong>{HOSTING.operator}</strong> betrieben
            und auf Servern der <strong>{HOSTING.provider}</strong> gehostet
            (Standort: <strong>{HOSTING.location}</strong>). Die Domain lautet{" "}
            <strong>dicebudget.bottle-trade.de</strong>.
          </p>
          <p>
            Mit dem Hosting-Anbieter bestehen die üblichen technischen Zugriffe
            auf Server- und Zugriffsprotokolle im Rahmen des Betriebs.
          </p>
        </section>

        <section>
          <h2>9. Apple App Store (iOS)</h2>
          <p>
            Die iOS-App wird über den Apple App Store bereitgestellt. Für
            Kaufabwicklung, Store-Kontoverwaltung und plattformspezifische
            Verarbeitung durch Apple gelten die Datenschutzhinweise von Apple
            Inc. Wir erhalten von Apple keine E-Mail-Adresse von dir, sofern du
            uns keine mitteilst.
          </p>
          <p>
            Die App enthält keine Werbe-Tracker oder Analyse-SDKs von
            Drittanbietern.
          </p>
        </section>

        <section>
          <h2>10. Deine Rechte</h2>
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
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2>11. Kinder</h2>
          <p>
            Die App richtet sich nicht gezielt an Kinder unter 16 Jahren. Wenn
            du als Erziehungsberechtigte oder Erziehungsberechtigter von
            Datenverarbeitung bei Minderjährigen Kenntnis erhältst, kontaktiere
            uns bitte.
          </p>
        </section>

        <section>
          <h2>12. Änderungen</h2>
          <p>
            Wir können diese Erklärung anpassen, wenn sich die App oder
            rechtliche Anforderungen ändern. Die aktuelle Fassung ist unter{" "}
            <a href={PRIVACY_URL}>{PRIVACY_URL.replace(/^https:\/\//, "")}</a>{" "}
            abrufbar.
          </p>
        </section>

      </article>
    </main>
  );
}
