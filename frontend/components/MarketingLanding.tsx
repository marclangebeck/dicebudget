import Link from "next/link";
import {
  APP_DESCRIPTION,
  APP_HOME_PATH,
  APP_NAME,
  PRIVACY_PATH,
} from "@/lib/branding";

export function MarketingLanding() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <img
          src="/apple-touch-icon.png"
          alt=""
          width={56}
          height={56}
          className="landing-logo"
          decoding="async"
        />
        <h1 className="landing-title">{APP_NAME}</h1>
        <p className="landing-tagline">Strategy Edition</p>
      </header>

      <p className="landing-lead">{APP_DESCRIPTION}</p>

      <ul className="landing-features">
        <li>Einzelspiel oder Raum mit Einladungscode</li>
        <li>Strategy mit Wurf-Pool oder klassisches Yatzy</li>
        <li>1 bis 6 Spielblöcke pro Partie</li>
        <li>Statistik und Multiplayer-Serien</li>
      </ul>

      <div className="landing-actions">
        <Link href={APP_HOME_PATH} className="landing-cta">
          Jetzt spielen
        </Link>
        <p className="landing-store-hint">
          iOS-App für den App Store — in Vorbereitung
        </p>
      </div>

      <footer className="landing-footer">
        <Link href={PRIVACY_PATH} className="landing-footer-link">
          Datenschutzerklärung
        </Link>
      </footer>
    </div>
  );
}
