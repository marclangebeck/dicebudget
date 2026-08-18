"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Alter Wizard — alles liegt jetzt auf dem Start-Screen. */
export default function SetupRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/?new=1");
  }, [router]);
  return <main className="t-shell">Lade…</main>;
}
