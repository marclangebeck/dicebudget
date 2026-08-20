"use client";

import { useEffect, useState } from "react";
import { APP_NAME, TOURNAMENT_APP_STORE_URL } from "@/lib/branding";
import { isBrowserAccessAllowed } from "@/lib/nativeShell";

type Props = {
  children: React.ReactNode;
};

export function NativeOnlyGate({ children }: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(isBrowserAccessAllowed());
  }, []);

  if (allowed === null) {
    return (
      <main className="t-shell t-shell--gate">
        <p className="t-meta">Lade…</p>
      </main>
    );
  }

  if (allowed) {
    return children;
  }

  return (
    <main className="t-shell t-shell--gate">
      <article className="t-card t-native-gate">
        <p className="t-native-gate-kicker">Nur als App</p>
        <h1 className="t-brand">{APP_NAME}</h1>
        <p className="t-native-gate-lead">
          Diese App ist ausschließlich für iPhone und iPad gedacht — nicht für den
          Browser.
        </p>
        <p className="t-meta">
          Installiere <strong>DiceBudget Tournament</strong> auf dem Host-iPad, um
          Events anzulegen, die Lobby zu steuern und den Beamer zu nutzen.
        </p>
        {TOURNAMENT_APP_STORE_URL ? (
          <a
            className="t-btn t-native-gate-cta"
            href={TOURNAMENT_APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Im App Store laden
          </a>
        ) : (
          <p className="t-native-gate-hint">
            Aktuell über TestFlight / Xcode-Install auf dem Event-iPad.
          </p>
        )}
        <p className="t-native-gate-foot">Browser-Zugriff ist deaktiviert.</p>
      </article>
    </main>
  );
}
