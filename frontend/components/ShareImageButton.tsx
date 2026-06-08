"use client";

import { useCallback, useState } from "react";
import { shareCardTitle, shareImageAndText } from "@/lib/shareSocial";

type Props = {
  label?: string;
  shareSuffix: string;
  filename: string;
  buildText: () => string;
  buildImage: () => Promise<Blob>;
  className?: string;
};

export function ShareImageButton({
  label = "Teilen",
  shareSuffix,
  filename,
  buildText,
  buildImage,
  className = "",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const onShare = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    const text = buildText();
    const title = shareCardTitle(shareSuffix);

    try {
      const blob = await buildImage();
      const result = await shareImageAndText({ blob, filename, title, text });
      if (result === "downloaded") {
        setStatus("Bild gespeichert");
      }
    } catch {
      setStatus("Teilen nicht möglich");
    } finally {
      setBusy(false);
    }
  }, [busy, buildImage, buildText, filename, shareSuffix]);

  return (
    <span className={`share-image-btn-wrap${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="share-image-btn"
        disabled={busy}
        aria-label={`${label} — Bilanz als Bild`}
        onClick={() => void onShare()}
      >
        <ShareIcon />
        <span>{busy ? "…" : label}</span>
      </button>
      {status && <span className="share-image-btn-status">{status}</span>}
    </span>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="share-image-btn-icon">
      <path
        fill="currentColor"
        d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.27 3.27 0 0 0 0-1.39l7.05-4.11A3.27 3.27 0 0 0 18 7.91c1.8 0 3.27-1.47 3.27-3.27S19.8 1.37 18 1.37 14.73 2.84 14.73 4.64c0 .23.03.45.08.67L7.71 9.42a3.27 3.27 0 0 0-1.96-.77C3.95 8.65 2.48 10.12 2.48 11.92S3.95 15.19 5.75 15.19c.76 0 1.44-.3 1.96-.77l7.1 4.11c-.05.22-.08.44-.08.67 0 1.8 1.47 3.27 3.27 3.27s3.27-1.47 3.27-3.27-1.47-3.27-3.27-3.27"
      />
    </svg>
  );
}
