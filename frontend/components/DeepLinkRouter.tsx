"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isCapacitorNative } from "@/lib/apiBase";
import { pathFromInviteDeepLink } from "@/lib/inviteJoinUrl";

type Props = {
  children: ReactNode;
};

/**
 * Universal Links / Deep Links: öffnet /multi/join?code=… in der nativen App
 * (TestFlight und Store). Web bleibt unverändert.
 */
export function DeepLinkRouter({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!isCapacitorNative()) return;

    let remove: (() => void) | undefined;
    let cancelled = false;

    function navigateFromUrl(raw: string) {
      const path = pathFromInviteDeepLink(raw);
      if (path) router.push(path);
    }

    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        if (cancelled) return;

        const launch = await App.getLaunchUrl();
        if (launch?.url) navigateFromUrl(launch.url);

        const handle = await App.addListener("appUrlOpen", (event) => {
          navigateFromUrl(event.url);
        });
        remove = () => {
          void handle.remove();
        };
      } catch {
        /* Web / Plugin fehlt */
      }
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [router]);

  return <>{children}</>;
}
