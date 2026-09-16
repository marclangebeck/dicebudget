"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  getPublicWebPlayRedirectUrl,
  isNativeAppClient,
  isWebPlayRoute,
} from "@/lib/webPlayAccess";

type Props = {
  children: ReactNode;
};

/**
 * Blockiert Spiel-Routen im öffentlichen Browser (Redirect App Store).
 * Capacitor-iOS/Android behält Zugriff auf /app, /play, …
 */
export function WebPlayAccessGate({ children }: Props) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isWebPlayRoute(pathname)) {
        if (!cancelled) setAllowed(true);
        return;
      }

      const native = await isNativeAppClient();
      if (cancelled) return;

      if (native) {
        setAllowed(true);
        return;
      }

      window.location.replace(getPublicWebPlayRedirectUrl());
      setAllowed(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (allowed === null && isWebPlayRoute(pathname)) {
    return (
      <main className="landing-shell pt-safe pb-safe">
        <p className="text-muted text-center text-sm">Weiterleitung …</p>
      </main>
    );
  }

  if (allowed === false) {
    return null;
  }

  return <>{children}</>;
}
