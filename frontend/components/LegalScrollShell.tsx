"use client";

import { useEffect, type ReactNode } from "react";
import { AppLegalFooter } from "@/components/AppLegalFooter";

const FIXED_ROUTE_CLASSES = ["home-route", "setup-route", "play-route"] as const;

type Props = {
  children: ReactNode;
};

/** Rechtstexte: eigener Scroll-Container (Capacitor iOS: scrollEnabled false). */
export function LegalScrollShell({ children }: Props) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    for (const cls of FIXED_ROUTE_CLASSES) {
      html.classList.remove(cls);
      body.classList.remove(cls);
    }
    html.classList.add("legal-route");
    body.classList.add("legal-route");

    return () => {
      html.classList.remove("legal-route");
      body.classList.remove("legal-route");
    };
  }, []);

  return (
    <div className="legal-screen app-bg h-dvh max-h-dvh min-h-0 w-full max-w-full overflow-hidden">
      <div className="legal-page-scroll pt-safe">{children}</div>
      <AppLegalFooter />
    </div>
  );
}
