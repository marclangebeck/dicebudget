import Link from "next/link";
import { CONTACT_EMAIL, IMPRESSUM_PATH, PRIVACY_PATH } from "@/lib/branding";

export function AppLegalFooter() {
  return (
    <footer className="app-legal-footer">
      <Link href={PRIVACY_PATH} className="app-legal-link">
        Datenschutz
      </Link>
      <span aria-hidden className="app-legal-sep">
        ·
      </span>
      <Link href={IMPRESSUM_PATH} className="app-legal-link">
        Impressum
      </Link>
      <span aria-hidden className="app-legal-sep">
        ·
      </span>
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("dice.budget Support")}`}
        className="app-legal-link"
      >
        Support
      </a>
    </footer>
  );
}
