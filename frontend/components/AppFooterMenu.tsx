"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  APP_HOME_PATH,
  APP_NAME,
  APP_SHORT,
  BOTTLE_TRADE_URL,
  CONTACT_EMAIL,
  IMPRESSUM_PATH,
  PRIVACY_PATH,
} from "@/lib/branding";
import { formatAppVersionLabel, resolveAppVersionLabel } from "@/lib/appVersion";
import { requestAppTour } from "@/lib/appTourPrefs";
import { useFocusTrap } from "@/lib/useFocusTrap";

type Props = {
  open: boolean;
  onClose: () => void;
};

type MenuEntry = {
  key: string;
  label: string;
  hint: string;
  icon: ReactNode;
  /** Interner App-Pfad (clientseitig via router.push). */
  appPath?: string;
  /** Externe URL oder mailto: */
  href?: string;
  external?: boolean;
  onSelect?: () => void;
};

const ADMIN_PATH = "/settings/admin";

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

function AdminIcon() {
  return (
    <svg className="app-footer-menu-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M12 3 5 6.2v5.1c0 4.1 2.7 7.7 7 9.7 4.3-2 7-5.6 7-9.7V6.2L12 3Z" />
      <path d="M12 11v4" />
      <path d="M12 8.2h.01" />
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

function isAppHomePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === APP_HOME_PATH ||
    pathname === `${APP_HOME_PATH}/` ||
    pathname.endsWith("/app") ||
    pathname.endsWith("/app/")
  );
}

export function AppFooterMenu({ open, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [versionLabel, setVersionLabel] = useState(() => formatAppVersionLabel());
  useFocusTrap(panelRef, open);

  useEffect(() => {
    let cancelled = false;
    void resolveAppVersionLabel().then((label) => {
      if (!cancelled) setVersionLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  /** Menü zuerst schließen, dann clientseitig navigieren (Capacitor-sicher). */
  function goApp(path: string) {
    onClose();
    window.setTimeout(() => {
      router.push(path);
    }, 0);
  }

  function startTourFromMenu() {
    onClose();
    requestAppTour("all");
    if (!isAppHomePath(pathname)) {
      window.setTimeout(() => {
        router.push(APP_HOME_PATH);
      }, 0);
    }
  }

  const menuEntries: MenuEntry[] = [
    {
      key: "tour",
      label: "App-Tour",
      hint: "Start, Strategy & Statistik",
      icon: <TourIcon />,
      onSelect: startTourFromMenu,
    },
    {
      key: "admin",
      label: "Admin",
      hint: "PIN, Key, spätere Config",
      icon: <AdminIcon />,
      onSelect: () => goApp(ADMIN_PATH),
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
      icon: <PrivacyIcon />,
      onSelect: () => goApp(PRIVACY_PATH),
    },
    {
      key: "impressum",
      label: "Impressum",
      hint: "Anbieter & Kontakt",
      icon: <InfoIcon />,
      onSelect: () => goApp(IMPRESSUM_PATH),
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
          {menuEntries.map((entry, index) => {
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

            if (entry.onSelect) {
              return (
                <li key={entry.key} className="app-footer-menu-row">
                  <button
                    type="button"
                    className={className}
                    style={style}
                    tabIndex={open ? 0 : -1}
                    onClick={entry.onSelect}
                  >
                    {content}
                  </button>
                </li>
              );
            }

            const href = entry.href ?? "#";
            return (
              <li key={entry.key} className="app-footer-menu-row">
                <a
                  href={href}
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
              </li>
            );
          })}
        </ul>

        <p className="app-footer-menu-foot">Würfel. Strategie. Bilanz.</p>
        <p className="app-footer-menu-version" aria-label="App-Version">
          {versionLabel}
        </p>
      </nav>
    </div>
  );
}
