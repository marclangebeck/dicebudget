"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppFooterMenu } from "@/components/AppFooterMenu";
import { AppToast } from "@/components/AppToast";
import { ScreenshotCaptureFlash } from "@/components/ScreenshotCaptureFlash";
import { ScreenshotPreviewDialog } from "@/components/ScreenshotPreviewDialog";
import { APP_HOME_PATH } from "@/lib/branding";
import { captureVisibleScreen } from "@/lib/screenCapture";
import { flashDelay, waitForScreenPaint } from "@/lib/screenshotFlow";
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

function ScreenshotIcon() {
  return (
    <svg className="app-legal-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M5 8.5h2.2l1.2-1.6a1.2 1.2 0 0 1 .96-.5h5.24a1.2 1.2 0 0 1 .96.5L16.8 8.5H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`app-legal-icon app-legal-menu-icon ${open ? "app-legal-menu-icon--open" : ""}`}
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
    >
      <path className="app-legal-menu-bar app-legal-menu-bar--top" d="M5 7h14" />
      <path className="app-legal-menu-bar app-legal-menu-bar--mid" d="M5 12h14" />
      <path className="app-legal-menu-bar app-legal-menu-bar--bot" d="M5 17h14" />
    </svg>
  );
}

export function AppLegalFooter() {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [screenshotBusy, setScreenshotBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const previewBlobRef = useRef<Blob | null>(null);

  const homeActive =
    pathname === APP_HOME_PATH ||
    pathname === "/" ||
    pathname.startsWith(`${APP_HOME_PATH}/`);
  const statsActive = pathname === "/stats" || pathname.startsWith("/stats/");
  const settingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  const clearPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewBlobRef.current = null;
    setPreviewUrl(null);
    setPreviewOpen(false);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleScreenshot = useCallback(async () => {
    if (screenshotBusy || previewOpen) return;
    setScreenshotBusy(true);
    setToastMessage(null);
    setMenuOpen(false);

    try {
      await waitForScreenPaint();
      setFlashActive(true);
      await flashDelay();
      setFlashActive(false);

      const blob = await captureVisibleScreen();
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewBlobRef.current = blob;
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch {
      setToastMessage("Screenshot fehlgeschlagen");
    } finally {
      setScreenshotBusy(false);
      setFlashActive(false);
    }
  }, [previewOpen, previewUrl, screenshotBusy]);

  const handleShare = useCallback(async () => {
    const blob = previewBlobRef.current;
    if (!blob || sharing) return;
    setSharing(true);
    try {
      const result = await shareImageAndText({
        blob,
        filename: "dicebudget-screenshot.png",
        title: shareCardTitle("Screenshot"),
        text: shareCardTitle("Screenshot"),
      });
      clearPreview();
      if (result === "shared") {
        setToastMessage("Screenshot geteilt");
      } else if (result === "downloaded") {
        setToastMessage("Screenshot gespeichert");
      }
    } catch {
      setToastMessage("Teilen fehlgeschlagen");
    } finally {
      setSharing(false);
    }
  }, [clearPreview, sharing]);

  return (
    <>
      <footer className="app-legal-footer app-legal-footer--5">
        <Link
          href={APP_HOME_PATH}
          className={`app-legal-link${homeActive ? " app-legal-link--active" : ""}`}
          aria-current={homeActive ? "page" : undefined}
        >
          <HomeIcon />
          <span>Home</span>
        </Link>
        <Link
          href="/stats"
          className={`app-legal-link${statsActive ? " app-legal-link--active" : ""}`}
          aria-current={statsActive ? "page" : undefined}
        >
          <StatsIcon />
          <span>Statistik</span>
        </Link>
        <Link
          href="/settings"
          className={`app-legal-link${settingsActive ? " app-legal-link--active" : ""}`}
          aria-current={settingsActive ? "page" : undefined}
        >
          <SettingsIcon />
          <span>Spielregeln</span>
        </Link>
        <button
          type="button"
          className="app-legal-link app-legal-link--screenshot"
          aria-label="Screenshot erstellen"
          disabled={screenshotBusy}
          onClick={() => void handleScreenshot()}
        >
          <ScreenshotIcon />
          <span>{screenshotBusy ? "…" : "Bild"}</span>
        </button>
        <button
          type="button"
          className={`app-legal-link app-legal-link--menu ${menuOpen ? "app-legal-link--menu-open" : ""}`}
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          aria-label="Menü öffnen"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon open={menuOpen} />
          <span>Menü</span>
        </button>
      </footer>

      <AppFooterMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScreenshotCaptureFlash active={flashActive} />
      <ScreenshotPreviewDialog
        open={previewOpen}
        previewUrl={previewUrl}
        sharing={sharing}
        onShare={() => void handleShare()}
        onDiscard={clearPreview}
      />
      <AppToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  );
}
