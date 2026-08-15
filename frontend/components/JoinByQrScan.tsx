"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { normalizeInviteCode } from "@/lib/activeGame";
import { pathFromInviteDeepLink } from "@/lib/inviteJoinUrl";

type Props = {
  /** Startscreen-Mitte zwischen Multi und Solo */
  variant?: "home" | "panel";
};

function resolveJoinPathFromScan(raw: string): string | null {
  const trimmed = raw.trim();
  const fromUrl = pathFromInviteDeepLink(trimmed);
  if (fromUrl) return fromUrl;
  const code = normalizeInviteCode(trimmed);
  if (code.length >= 6) {
    return `/multi/join?code=${encodeURIComponent(code)}`;
  }
  return null;
}

/**
 * Beitritt nur per QR: öffnet die Gerätekamera in der App und leitet zur Lobby.
 * (System-Kamera + Universal Link bleibt parallel nutzbar.)
 */
export function JoinByQrScan({ variant = "home" }: Props) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
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
      const path = resolveJoinPathFromScan(result.data);
      if (path) {
        handledRef.current = true;
        stopScanner();
        router.push(path);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [router, stopScanner]);

  async function startScanner() {
    setError(null);
    handledRef.current = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Kamera hier nicht verfügbar. Öffne die Kamera-App und scanne den QR — die App öffnet sich automatisch.",
      );
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
      // Video nach Render binden
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
        "Kein Kamerazugriff. Erlaube die Kamera oder öffne die Kamera-App und scanne den QR des Hosts.",
      );
      stopScanner();
    }
  }

  const panel = (
    <section
      className={variant === "home" ? "home-cinematic-join home-cinematic-join--qr" : "join-qr-panel"}
      aria-label="Multi-Spiel per QR beitreten"
      data-tour-anchor="join"
    >
      <div className={variant === "home" ? "home-cinematic-join-copy" : "join-qr-panel-copy"}>
        <p className={variant === "home" ? "home-cinematic-join-kicker" : "join-qr-panel-kicker"}>
          Multi-Spiel
        </p>
        <p className={variant === "home" ? "home-cinematic-join-title" : "join-qr-panel-title"}>
          Gegner-Raum beitreten
        </p>
        <p className={variant === "home" ? "home-cinematic-join-hint" : "join-qr-panel-hint"}>
          QR vom Host scannen — direkt in die Lobby
        </p>
      </div>
      <button
        type="button"
        className={
          variant === "home"
            ? "home-cinematic-join-scan"
            : "glass-button glass-button--primary min-h-12 w-full px-4 text-sm font-semibold"
        }
        onClick={() => void startScanner()}
      >
        <ScanIcon />
        <span>QR-Code scannen</span>
      </button>
      {error && (
        <p
          className={variant === "home" ? "home-cinematic-join-error" : "glass-alert-error mt-2 text-sm"}
          role="alert"
        >
          {error}
        </p>
      )}
    </section>
  );

  return (
    <>
      {panel}
      {scanning && (
        <div className="qr-scan-overlay" role="dialog" aria-modal="true" aria-label="QR-Code scannen">
          <div className="qr-scan-overlay-inner">
            <p className="qr-scan-overlay-title">QR anvisieren</p>
            <div className="qr-scan-frame">
              <video ref={videoRef} className="qr-scan-video" playsInline muted autoPlay />
              <div className="qr-scan-reticle" aria-hidden />
            </div>
            <p className="qr-scan-overlay-hint">
              Halte den QR des Hosts in den Rahmen. Alternativ: System-Kamera öffnen und scannen.
            </p>
            <button type="button" className="qr-scan-cancel" onClick={stopScanner}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </>
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
