"use client";

import Link from "next/link";
import {
  APP_NAME,
  BOTTLE_TRADE_URL,
  CONTACT_EMAIL,
  IMPRESSUM_PATH,
  PRIVACY_PATH,
} from "@/lib/branding";

type Props = {
  open: boolean;
  onClose: () => void;
};

function SupportIcon() {
  return (
    <svg className="app-footer-menu-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M5 12a7 7 0 0 1 14 0v4.5A2.5 2.5 0 0 1 16.5 19H15" />
      <path d="M5 12v3a2 2 0 0 0 2 2h1v-5H5Z" />
      <path d="M19 12v3a2 2 0 0 1-2 2h-1v-5h3Z" />
      <path d="M11 19h4" />
    </svg>
  );
}

function PrivacyIcon() {
  return (
    <svg className="app-footer-menu-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M12 4 6.5 6.3v5.2c0 3.6 2.2 6.7 5.5 8.5 3.3-1.8 5.5-4.9 5.5-8.5V6.3L12 4Z" />
      <path d="M9.5 12.2 11.3 14l3.4-4" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="app-footer-menu-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className="app-footer-menu-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
    </svg>
  );
}

export function AppFooterMenu({ open, onClose }: Props) {
  if (!open) return null;

  const supportHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} Support`)}`;

  return (
    <div className="app-footer-menu" data-capture-exclude="true" role="dialog" aria-modal="true" aria-label="Menü">
      <button type="button" className="app-footer-menu-backdrop" aria-label="Menü schließen" onClick={onClose} />
      <nav className="app-footer-menu-panel">
        <header className="app-footer-menu-head">
          <p className="app-footer-menu-kicker">Menü</p>
          <button type="button" className="app-footer-menu-close" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </header>

        <ul className="app-footer-menu-list">
          <li>
            <a href={supportHref} className="app-footer-menu-item" onClick={onClose}>
              <SupportIcon />
              <span>Support</span>
            </a>
          </li>
          <li>
            <Link href={PRIVACY_PATH} className="app-footer-menu-item" onClick={onClose}>
              <PrivacyIcon />
              <span>Datenschutz</span>
            </Link>
          </li>
          <li>
            <Link href={IMPRESSUM_PATH} className="app-footer-menu-item" onClick={onClose}>
              <InfoIcon />
              <span>Impressum</span>
            </Link>
          </li>
          <li>
            <a
              href={BOTTLE_TRADE_URL}
              className="app-footer-menu-item"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
            >
              <ExternalIcon />
              <span>bottle-trade.de</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
