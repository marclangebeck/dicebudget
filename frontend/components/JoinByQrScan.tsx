"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { normalizeInviteCode } from "@/lib/activeGame";
import { pathFromInviteDeepLink } from "@/lib/inviteJoinUrl";
import {
  pathFromAnyJoinDeepLink,
  pathFromTournamentJoinDeepLink,
  TOURNAMENT_JOIN_PATH,
} from "@/lib/tournamentJoinUrl";

type JoinKind = "multi" | "tournament";

type Props = {
  /** Startscreen-Mitte zwischen Multi und Solo */
  variant?: "home" | "panel";
  /** multi = Gegner-Raum; tournament = Event (Liga/Turnier) */
  kind?: JoinKind;
};

function resolveJoinPathFromScan(raw: string, prefer: JoinKind): string | null {
  const trimmed = raw.trim();
  if (prefer === "tournament") {
    const tournament = pathFromTournamentJoinDeepLink(trimmed);
    if (tournament) return tournament;
    const multi = pathFromInviteDeepLink(trimmed);
    if (multi) return multi;
    const code = normalizeInviteCode(trimmed);
    if (code.length >= 6) {
      return `${TOURNAMENT_JOIN_PATH}?code=${encodeURIComponent(code)}`;
    }
    return null;
  }
  const fromUrl = pathFromAnyJoinDeepLink(trimmed);
  if (fromUrl) return fromUrl;
  const code = normalizeInviteCode(trimmed);
  if (code.length >= 6) {
    return `/multi/join?code=${encodeURIComponent(code)}`;
  }
  return null;
}

/**
 * Beitritt per QR-Scan oder manuellem Raumcode.
 */
export function JoinByQrScan({ variant = "home", kind = "multi" }: Props) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [codeEntry, setCodeEntry] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);

  const stopScanner = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setScanning(false);
  }, []);

  const closeOverlay = useCallback(() => {
    stopScanner();
    setCodeEntry(false);
    setManualCode("");
    setError(null);
  }, [stopScanner]);

  useEffect(() => () => stopScanner(), [stopScanner]);

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || handledRef.current) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const canvas = document.createElement("canvas");
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w < 16 || h < 16) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    ctx.drawImage(video, 0, 0, w, h);
    const image = ctx.getImageData(0, 0, w, h);
    const result = jsQR(image.data, image.width, image.height, {
      inversionAttempts: "dontInvert",
    });
    if (result?.data) {
      const path = resolveJoinPathFromScan(result.data, kind);
      if (path) {
        handledRef.current = true;
        stopScanner();
        router.push(path);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [kind, router, stopScanner]);

  async function startScanner() {
    setError(null);
    setCodeEntry(false);
    handledRef.current = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Kamera hier nicht verfügbar. Nutze „Code eingeben“ oder die System-Kamera.",
      );
      setCodeEntry(true);
      setScanning(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setScanning(true);
      window.setTimeout(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        void video.play().then(() => {
          rafRef.current = requestAnimationFrame(tick);
        });
      }, 50);
    } catch {
      setError(
        "Kein Kamerazugriff. Nutze „Code eingeben“ oder erlaube die Kamera.",
      );
      setCodeEntry(true);
      setScanning(true);
    }
  }

  function openCodeEntryFromTile(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setManualCode("");
    setCodeEntry(true);
    setScanning(true);
  }

  function submitManualCode(e: React.FormEvent) {
    e.preventDefault();
    const path = resolveJoinPathFromScan(manualCode, kind);
    if (!path) {
      setError("Bitte einen gültigen Raumcode eingeben (mind. 6 Zeichen).");
      return;
    }
    closeOverlay();
    router.push(path);
  }

  function showCodeEntryBesideCamera() {
    stopScanner();
    setError(null);
    setManualCode("");
    setCodeEntry(true);
    setScanning(true);
  }

  const overlay =
    scanning || codeEntry ? (
      <div
        className="qr-scan-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={codeEntry ? "Raumcode eingeben" : "QR-Code scannen"}
      >
        <div className="qr-scan-overlay-inner">
          {codeEntry ? (
            <>
              <p className="qr-scan-overlay-title">Code eingeben</p>
              <form className="qr-code-entry" onSubmit={submitManualCode}>
                <label className="qr-code-entry-label" htmlFor="join-manual-code">
                  Raumcode
                </label>
                <input
                  id="join-manual-code"
                  className="glass-input qr-code-entry-input w-full text-center uppercase tracking-[0.18em]"
                  value={manualCode}
                  onChange={(e) => setManualCode(normalizeInviteCode(e.target.value))}
                  placeholder="z. B. 438J7G4X"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  autoFocus
                  inputMode="text"
                />
                <button
                  type="submit"
                  className="glass-button glass-button--primary min-h-11 w-full px-4 text-sm font-semibold"
                >
                  Beitreten
                </button>
              </form>
              {error && (
                <p className="qr-scan-overlay-hint" role="alert">
                  {error}
                </p>
              )}
              <button type="button" className="qr-scan-cancel" onClick={closeOverlay}>
                Abbrechen
              </button>
            </>
          ) : (
            <>
              <p className="qr-scan-overlay-title">QR anvisieren</p>
              <div className="qr-scan-frame">
                <video ref={videoRef} className="qr-scan-video" playsInline muted autoPlay />
                <div className="qr-scan-reticle" aria-hidden />
              </div>
              <p className="qr-scan-overlay-hint">
                Vor Ort: QR scannen. Remote: „Code eingeben“ nutzen.
              </p>
              {error && (
                <p className="qr-scan-overlay-hint" role="alert">
                  {error}
                </p>
              )}
              <button type="button" className="qr-scan-cancel" onClick={closeOverlay}>
                Abbrechen
              </button>
              <button
                type="button"
                className="qr-scan-code-below-btn"
                onClick={showCodeEntryBesideCamera}
              >
                Code eingeben
              </button>
            </>
          )}
        </div>
      </div>
    ) : null;

  if (kind === "tournament" && variant === "home") {
    return (
      <>
        <div className="home-cinematic-join-slot">
          <div className="home-cinematic-join home-cinematic-join--tournament">
            <button
              type="button"
              className="home-cinematic-join-main home-cinematic-join--hit"
              aria-label="Turnier/Liga beitreten, QR-Code scannen"
              data-tour-anchor="tournament-join"
              onClick={() => void startScanner()}
            >
              <span className="home-cinematic-join-copy">
                <span className="home-cinematic-join-kicker">Ereignis</span>
                <span className="home-cinematic-join-title">Turnier/Liga beitreten</span>
                <span className="home-cinematic-join-cta">
                  <ScanIcon />
                  <span>QR-Code scannen</span>
                </span>
              </span>
            </button>
            <button
              type="button"
              className="home-cinematic-join-code-link"
              onClick={openCodeEntryFromTile}
            >
              Code eingeben
            </button>
          </div>
          {error && !scanning && (
            <p className="home-cinematic-join-error" role="alert">
              {error}
            </p>
          )}
        </div>
        {overlay}
      </>
    );
  }

  if (kind === "tournament") {
    return (
      <>
        <section
          className="join-qr-panel"
          aria-label="Ereignis per QR oder Code beitreten"
          data-tour-anchor="tournament-join"
        >
          <div className="join-qr-panel-copy">
            <p className="join-qr-panel-kicker">Ereignis</p>
            <p className="join-qr-panel-title">Turnier/Liga beitreten</p>
            <p className="join-qr-panel-hint">QR scannen oder Code eingeben</p>
          </div>
          <div className="join-qr-panel-actions">
            <button
              type="button"
              className="glass-button glass-button--primary min-h-12 flex-1 px-4 text-sm font-semibold"
              onClick={() => void startScanner()}
            >
              <ScanIcon />
              <span>QR-Code scannen</span>
            </button>
            <button
              type="button"
              className="glass-button min-h-12 flex-1 px-4 text-sm font-semibold"
              onClick={() => {
                setError(null);
                setManualCode("");
                setCodeEntry(true);
                setScanning(true);
              }}
            >
              Code eingeben
            </button>
          </div>
          {error && !scanning && (
            <p className="glass-alert-error mt-2 text-sm" role="alert">
              {error}
            </p>
          )}
        </section>
        {overlay}
      </>
    );
  }

  if (variant === "home") {
    return (
      <>
        <div className="home-cinematic-join-slot">
          <div className="home-cinematic-join home-cinematic-join--multi">
            <button
              type="button"
              className="home-cinematic-join-main home-cinematic-join--hit"
              aria-label="Multi-Spiel: Gegner-Raum beitreten, QR-Code scannen"
              data-tour-anchor="join"
              onClick={() => void startScanner()}
            >
              <span className="home-cinematic-join-copy">
                <span className="home-cinematic-join-kicker">Multi-Spiel</span>
                <span className="home-cinematic-join-title">Gegner-Raum beitreten</span>
                <span className="home-cinematic-join-cta">
                  <ScanIcon />
                  <span>QR-Code scannen</span>
                </span>
              </span>
            </button>
            <button
              type="button"
              className="home-cinematic-join-code-link"
              onClick={openCodeEntryFromTile}
            >
              Code eingeben
            </button>
          </div>
          {error && !scanning && (
            <p className="home-cinematic-join-error" role="alert">
              {error}
            </p>
          )}
        </div>
        {overlay}
      </>
    );
  }

  return (
    <>
      <section
        className="join-qr-panel"
        aria-label="Multi-Spiel per QR oder Code beitreten"
        data-tour-anchor="join"
      >
        <div className="join-qr-panel-copy">
          <p className="join-qr-panel-kicker">Multi-Spiel</p>
          <p className="join-qr-panel-title">Gegner-Raum beitreten</p>
          <p className="join-qr-panel-hint">QR scannen oder Code eingeben</p>
        </div>
        <div className="join-qr-panel-actions">
          <button
            type="button"
            className="glass-button glass-button--primary min-h-12 flex-1 px-4 text-sm font-semibold"
            onClick={() => void startScanner()}
          >
            <ScanIcon />
            <span>QR-Code scannen</span>
          </button>
          <button
            type="button"
            className="glass-button min-h-12 flex-1 px-4 text-sm font-semibold"
            onClick={() => {
              setError(null);
              setManualCode("");
              setCodeEntry(true);
              setScanning(true);
            }}
          >
            Code eingeben
          </button>
        </div>
        {error && !scanning && (
          <p className="glass-alert-error mt-2 text-sm" role="alert">
            {error}
          </p>
        )}
      </section>
      {overlay}
    </>
  );
}

export function TournamentJoinScan({ variant = "home" }: { variant?: "home" | "panel" }) {
  return <JoinByQrScan variant={variant} kind="tournament" />;
}

export function HomeJoinButtons() {
  return (
    <div className="home-cinematic-join-row" aria-label="Beitreten per QR oder Code">
      <JoinByQrScan variant="home" kind="multi" />
      <TournamentJoinScan variant="home" />
    </div>
  );
}

function ScanIcon() {
  return (
    <svg className="home-cinematic-join-scan-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
