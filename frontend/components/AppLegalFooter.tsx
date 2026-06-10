"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AppFooterMenu } from "@/components/AppFooterMenu";
import { APP_HOME_PATH } from "@/lib/branding";
import { captureVisibleScreen } from "@/lib/screenCapture";
import { shareCardTitle, shareImageAndText } from "@/lib/shareSocial";

function HomeIcon() {
  return (
    <svg className="app-legal-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V20h11v-9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg className="app-legal-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="app-legal-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="app-legal-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M5 7h14" />
      <path d="M5 12h14" />
      <path d="M5 17h14" />
    </svg>
  );
}

export function AppLegalFooter() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [screenshotBusy, setScreenshotBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleScreenshot = useCallback(async () => {
    if (screenshotBusy) return;
    setScreenshotBusy(true);
    setStatusMessage(null);
    setMenuOpen(false);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    try {
      const blob = await captureVisibleScreen();
      const result = await shareImageAndText({
        blob,
        filename: "dicebudget-screenshot.png",
        title: shareCardTitle("Screenshot"),
        text: shareCardTitle("Screenshot"),
      });

      if (result === "downloaded") {
        setStatusMessage("Screenshot gespeichert — App zum Teilen öffnen");
        setMenuOpen(true);
      } else if (result === "shared") {
        setStatusMessage(null);
      }
    } catch {
      setStatusMessage("Screenshot fehlgeschlagen");
      setMenuOpen(true);
    } finally {
      setScreenshotBusy(false);
    }
  }, [screenshotBusy]);

  return (
    <>
      <footer className="app-legal-footer">
        <Link href={APP_HOME_PATH} className="app-legal-link app-legal-link--primary">
          <HomeIcon />
          <span>Home</span>
        </Link>
        <Link href="/stats" className="app-legal-link">
          <StatsIcon />
          <span>Statistik</span>
        </Link>
        <Link href="/settings" className="app-legal-link">
          <SettingsIcon />
          <span>Einstellungen</span>
        </Link>
        <button
          type="button"
          className={`app-legal-link app-legal-link--menu ${menuOpen ? "app-legal-link--menu-open" : ""}`}
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          aria-label="Menü öffnen"
          onClick={() => {
            setStatusMessage(null);
            setMenuOpen((open) => !open);
          }}
        >
          <MenuIcon />
          <span>Menü</span>
        </button>
      </footer>

      <AppFooterMenu
        open={menuOpen}
        screenshotBusy={screenshotBusy}
        statusMessage={statusMessage}
        onClose={() => setMenuOpen(false)}
        onScreenshot={handleScreenshot}
      />
    </>
  );
}
