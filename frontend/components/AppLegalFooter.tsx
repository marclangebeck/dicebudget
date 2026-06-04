import Link from "next/link";
import { APP_HOME_PATH, CONTACT_EMAIL, IMPRESSUM_PATH, PRIVACY_PATH } from "@/lib/branding";

function HomeIcon() {
  return (
    <svg className="app-legal-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V20h11v-9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function PrivacyIcon() {
  return (
    <svg className="app-legal-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M12 4 6.5 6.3v5.2c0 3.6 2.2 6.7 5.5 8.5 3.3-1.8 5.5-4.9 5.5-8.5V6.3L12 4Z" />
      <path d="M9.5 12.2 11.3 14l3.4-4" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="app-legal-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg className="app-legal-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M5 12a7 7 0 0 1 14 0v4.5A2.5 2.5 0 0 1 16.5 19H15" />
      <path d="M5 12v3a2 2 0 0 0 2 2h1v-5H5Z" />
      <path d="M19 12v3a2 2 0 0 1-2 2h-1v-5h3Z" />
      <path d="M11 19h4" />
    </svg>
  );
}

export function AppLegalFooter() {
  return (
    <footer className="app-legal-footer">
      <Link href={APP_HOME_PATH} className="app-legal-link app-legal-link--primary">
        <HomeIcon />
        <span>Home</span>
      </Link>
      <Link href={PRIVACY_PATH} className="app-legal-link">
        <PrivacyIcon />
        <span>Datenschutz</span>
      </Link>
      <Link href={IMPRESSUM_PATH} className="app-legal-link">
        <InfoIcon />
        <span>Impressum</span>
      </Link>
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("dice.budget Support")}`}
        className="app-legal-link"
      >
        <SupportIcon />
        <span>Support</span>
      </a>
    </footer>
  );
}
