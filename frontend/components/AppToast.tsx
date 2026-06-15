"use client";

import { useEffect } from "react";

type Props = {
  message: string | null;
  onDismiss: () => void;
};

const TOAST_MS = 3200;

export function AppToast({ message, onDismiss }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="app-toast" data-capture-exclude="true" role="status" aria-live="polite">
      {message}
    </div>
  );
}
