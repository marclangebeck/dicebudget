"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string;
  label?: string;
  size?: number;
  className?: string;
};

/** QR als Data-URL (Canvas) — funktioniert in Web und Capacitor. */
export function InviteQrCode({ value, label = "QR-Code zum Beitreten", size = 220, className = "" }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: size,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setError("QR-Code konnte nicht erzeugt werden.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }

  if (!dataUrl) {
    return (
      <div
        className={`invite-qr-skeleton${className ? ` ${className}` : ""}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt={label}
      className={`invite-qr-image${className ? ` ${className}` : ""}`}
    />
  );
}
