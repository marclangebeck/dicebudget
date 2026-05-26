"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isCapacitorNative } from "@/lib/apiBase";
import { APP_HOME_PATH } from "@/lib/branding";

type Props = {
  children: ReactNode;
};

/** In der iOS-App direkt zum Spiel-Start, im Browser die Landingpage. */
export function NativeAppEntry({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (isCapacitorNative()) {
      router.replace(APP_HOME_PATH);
    }
  }, [router]);

  if (typeof window !== "undefined" && isCapacitorNative()) {
    return (
      <main className="landing-shell pt-safe pb-safe">
        <p className="text-muted text-center text-sm">Lade …</p>
      </main>
    );
  }

  return <>{children}</>;
}
