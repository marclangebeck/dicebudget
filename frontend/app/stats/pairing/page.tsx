"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PairingRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = (searchParams.get("key") ?? "").trim();

  useEffect(() => {
    if (key) {
      router.replace(`/stats?pairing=${encodeURIComponent(key)}`);
      return;
    }
    router.replace("/stats");
  }, [key, router]);

  return <p className="stats-empty-state">Weiterleitung …</p>;
}

/** Alte Paarungs-URLs leiten auf die Statistik-Übersicht mit geöffnetem Accordion um. */
export default function PairingDetailPage() {
  return (
    <Suspense fallback={<p className="stats-empty-state">Weiterleitung …</p>}>
      <PairingRedirectInner />
    </Suspense>
  );
}
