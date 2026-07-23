"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  APP_NAME,
  APP_SHORT,
  BOTTLE_TRADE_URL,
  CONTACT_EMAIL,
  IMPRESSUM_PATH,
  PRIVACY_PATH,
} from "@/lib/branding";
import { useFocusTrap } from "@/lib/useFocusTrap";

type Props = {
  open: boolean;
  onClose: () => void;
};

type MenuEntry = {
  key: string;
  label: string;
  hint: string;
  href: string;
  external?: boolean;
  icon: ReactNode;
};

function TourIcon() {
  return (
    <svg className="app-footer-menu-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5v2.2" />
      <path d="M12 16.8V19" />
      <path d="M5 12h2.2" />
      <path d="M16.8 12H19" />
      <path d="m7.05 7.05 1.55 1.55" />
      <path d="m15.4 15.4 1.55 1.55" />
      <path d="m16.95 7.05-1.55 1.55" />
      <path d="m8.6 15.4-1.55 1.55" />
    </svg>
  );
}

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

function MenuDiceDecor() {
  return (
    <div className="app-footer-menu-dice" aria-hidden>
      <span className="app-footer-menu-die app-footer-menu-die--a">
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className="app-footer-menu-die app-footer-menu-die--b">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

const MENU_ENTRIES: MenuEntry[] = [
  {
    key: "tour",
    label: "App-Tour",
    hint: "Start, Strategy & Rivalen",
    href: "/app?tour=all",
    icon: <TourIcon />,
  },
  {
    key: "support",
    label: "Support",
    hint: "Fragen & Feedback",
    href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} Support`)}`,
    icon: <SupportIcon />,
  },
  {
    key: "privacy",
    label: "Datenschutz",
    hint: "Deine Daten",
    href: PRIVACY_PATH,
    icon: <PrivacyIcon />,
  },
  {
    key: "impressum",
    label: "Impressum",
    hint: "Anbieter & Kontakt",
    href: IMPRESSUM_PATH,
    icon: <InfoIcon />,
  },
  {
    key: "bottle-trade",
    label: "bottle-trade.de",
    hint: "Mutterprojekt",
    href: BOTTLE_TRADE_URL,
    external: true,
    icon: <ExternalIcon />,
  },
];

export function AppFooterMenu({ open, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`app-footer-menu ${open ? "is-open" : ""}`}
      data-capture-exclude="true"
      role="dialog"
      aria-modal="true"
      aria-label="Menü"
      aria-hidden={!open}
      inert={open ? undefined : true}
    >
      <button
        type="button"
        className="app-footer-menu-backdrop"
        aria-label="Menü schließen"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <nav ref={panelRef} className="app-footer-menu-sheet" aria-label="Menü">
        <div className="app-footer-menu-sheet-glow" aria-hidden />
        <header className="app-footer-menu-brand">
          <MenuDiceDecor />
          <div className="app-footer-menu-brand-copy">
            <p className="app-footer-menu-brand-name">{APP_SHORT}</p>
            <p className="app-footer-menu-brand-tag">Strategy Edition</p>
          </div>
          <button
            type="button"
            className="app-footer-menu-close"
            onClick={onClose}
            aria-label="Schließen"
            tabIndex={open ? 0 : -1}
          >
            <span aria-hidden />
            <span aria-hidden />
          </button>
        </header>

        <ul className="app-footer-menu-list">
          {MENU_ENTRIES.map((entry, index) => {
            const className = "app-footer-menu-item";
            const style = { "--menu-item-index": index } as CSSProperties;
            const content = (
              <>
                <span className="app-footer-menu-item-icon">{entry.icon}</span>
                <span className="app-footer-menu-item-copy">
                  <span className="app-footer-menu-item-label">{entry.label}</span>
                  <span className="app-footer-menu-item-hint">{entry.hint}</span>
                </span>
                <span className="app-footer-menu-item-chevron" aria-hidden />
              </>
            );

            return (
              <li key={entry.key} className="app-footer-menu-row">
                {entry.external || entry.href.startsWith("mailto:") ? (
                  <a
                    href={entry.href}
                    className={className}
                    style={style}
                    tabIndex={open ? 0 : -1}
                    {...(entry.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    onClick={onClose}
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    href={entry.href}
                    className={className}
                    style={style}
                    tabIndex={open ? 0 : -1}
                    onClick={onClose}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <p className="app-footer-menu-foot">Würfel. Strategie. Bilanz.</p>
      </nav>
    </div>
  );
}
