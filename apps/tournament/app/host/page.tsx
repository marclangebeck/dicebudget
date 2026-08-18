"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HostCockpit } from "@/components/HostCockpit";
import { loadHostSession } from "@/lib/hostStore";

function HostPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fromQuery = (params.get("code") ?? "").trim().toUpperCase();
  const saved = loadHostSession();
  const inviteCode = fromQuery || saved?.inviteCode || "";

  if (!inviteCode) {
    return (
      <main className="t-shell">
        <p className="t-meta">Kein Event auf diesem Gerät.</p>
        <button type="button" className="t-btn" onClick={() => router.replace("/")}>
          Zum Start
        </button>
      </main>
    );
  }

  return (
    <HostCockpit
      inviteCode={inviteCode}
      onNewEvent={() => router.replace("/?new=1")}
      onSessionCleared={() => router.replace("/")}
    />
  );
}

export default function HostPage() {
  return (
    <Suspense fallback={<main className="t-shell">Lade Host…</main>}>
      <HostPageInner />
    </Suspense>
  );
}
