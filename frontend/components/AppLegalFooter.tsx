import Link from "next/link";
import { APP_HOME_PATH, CONTACT_EMAIL, IMPRESSUM_PATH, PRIVACY_PATH } from "@/lib/branding";

export function AppLegalFooter() {
  return (
    <footer className="app-legal-footer">
      <Link href={APP_HOME_PATH} className="app-legal-link">
        <span className="app-legal-glyph" aria-hidden>
          H
        </span>
        Home
      </Link>
      <span aria-hidden className="app-legal-sep">
        ·
      </span>
      <Link href={PRIVACY_PATH} className="app-legal-link">
        <span className="app-legal-glyph" aria-hidden>
          D
        </span>
        Datenschutz
      </Link>
      <span aria-hidden className="app-legal-sep">
        ·
      </span>
      <Link href={IMPRESSUM_PATH} className="app-legal-link">
        <span className="app-legal-glyph" aria-hidden>
          I
        </span>
        Impressum
      </Link>
      <span aria-hidden className="app-legal-sep">
        ·
      </span>
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("dice.budget Support")}`}
        className="app-legal-link"
      >
        <span className="app-legal-glyph" aria-hidden>
          ?
        </span>
        Support
      </a>
    </footer>
  );
}
