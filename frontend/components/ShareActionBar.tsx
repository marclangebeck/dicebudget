"use client";

import { useCallback, useState } from "react";
import {
  canShareImageFile,
  canUseWebShare,
  shareCardTitle,
  shareImageAndText,
  shareWhatsApp,
} from "@/lib/shareSocial";

type Props = {
  label?: string;
  shareSuffix: string;
  filename: string;
  buildText: () => string;
  buildImage: () => Promise<Blob>;
  prominent?: boolean;
};

export function ShareActionBar({
  label = "Teilen",
  shareSuffix,
  filename,
  buildText,
  buildImage,
  prominent = false,
}: Props) {
  const [busy, setBusy] = useState<"whatsapp" | "instagram" | "share" | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const runShare = useCallback(
    async (channel: "whatsapp" | "instagram" | "share") => {
      if (busy) return;
      setBusy(channel);
      setStatus(null);
      const text = buildText();
      const title = shareCardTitle(shareSuffix);

      try {
        const blob = await buildImage();

        if (channel === "whatsapp") {
          const canImage = await canShareImageFile();
          if (canImage && canUseWebShare()) {
            const file = new File([blob], filename, { type: "image/png" });
            try {
              await navigator.share({ text, files: [file] });
              return;
            } catch (err) {
              if (err instanceof Error && err.name === "AbortError") return;
            }
          }
          shareWhatsApp(text);
          return;
        }

        const result = await shareImageAndText({ blob, filename, title, text });
        if (result === "downloaded") {
          setStatus(
            channel === "instagram"
              ? "Bild gespeichert — in Instagram Story einfügen"
              : "Bild heruntergeladen — zum Teilen öffnen",
          );
        }
      } catch {
        shareWhatsApp(text);
        setStatus("Teilen über WhatsApp geöffnet");
      } finally {
        setBusy(null);
      }
    },
    [busy, buildImage, buildText, filename, shareSuffix],
  );

  return (
    <div
      className={`share-action-bar${prominent ? " share-action-bar--prominent" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="share-action-label">{label}</p>
      <div className="share-action-buttons">
        <button
          type="button"
          className="share-action-btn share-action-btn--whatsapp"
          disabled={busy !== null}
          aria-label="Über WhatsApp teilen"
          onClick={() => void runShare("whatsapp")}
        >
          <WhatsAppIcon />
          <span>{busy === "whatsapp" ? "…" : "WhatsApp"}</span>
        </button>
        <button
          type="button"
          className="share-action-btn share-action-btn--instagram"
          disabled={busy !== null}
          aria-label="Für Instagram Story teilen"
          onClick={() => void runShare("instagram")}
        >
          <InstagramIcon />
          <span>{busy === "instagram" ? "…" : "Instagram"}</span>
        </button>
        <button
          type="button"
          className="share-action-btn share-action-btn--more"
          disabled={busy !== null}
          aria-label="Weitere Apps zum Teilen"
          onClick={() => void runShare("share")}
        >
          <ShareIcon />
          <span>{busy === "share" ? "…" : "Teilen"}</span>
        </button>
      </div>
      {status && <p className="share-action-status">{status}</p>}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="share-action-icon">
      <path
        fill="currentColor"
        d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.23h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.6 8.6 0 0 1-4.16-1.07l-.3-.15-3.12.82.83-3.04-.2-.32a8.2 8.2 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.22-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.75 2.67 4.25 3.73.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.16-.48-.28-.25-.14-1.48-.73-1.71-.81-.23-.08-.4-.12-.57.12-.17.23-.66.81-.81.97-.15.17-.3.19-.55.07-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.57-1.38-.78-1.89-.2-.49-.41-.42-.57-.43l-.49-.01"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="share-action-icon">
      <path
        fill="currentColor"
        d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8a3.6 3.6 0 0 0 3.6 3.6h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6a3.6 3.6 0 0 0-3.6-3.6H7.6M17.25 6.05a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="share-action-icon">
      <path
        fill="currentColor"
        d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.27 3.27 0 0 0 0-1.39l7.05-4.11A3.27 3.27 0 0 0 18 7.91c1.8 0 3.27-1.47 3.27-3.27S19.8 1.37 18 1.37 14.73 2.84 14.73 4.64c0 .23.03.45.08.67L7.71 9.42a3.27 3.27 0 0 0-1.96-.77C3.95 8.65 2.48 10.12 2.48 11.92S3.95 15.19 5.75 15.19c.76 0 1.44-.3 1.96-.77l7.1 4.11c-.05.22-.08.44-.08.67 0 1.8 1.47 3.27 3.27 3.27s3.27-1.47 3.27-3.27-1.47-3.27-3.27-3.27"
      />
    </svg>
  );
}
