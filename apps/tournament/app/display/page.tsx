"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TournamentDisplayBoard } from "@/components/TournamentDisplayBoard";
import { loadHostSession } from "@/lib/hostStore";

function DisplayPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fromQuery = (params.get("code") ?? "").trim().toUpperCase();
  const focusMatchId = (params.get("match") ?? "").trim() || null;
  const saved = loadHostSession();
  const inviteCode = fromQuery || saved?.inviteCode || "";

  if (!inviteCode) {
    return (
      <main className="t-shell t-shell--display">
        <p className="t-display-empty">Kein Event-Code für die Anzeige.</p>
        <button type="button" className="t-btn" onClick={() => router.replace("/")}>
          Zum Start
        </button>
      </main>
    );
  }

  return (
    <TournamentDisplayBoard
      inviteCode={inviteCode}
      initialFocusMatchId={focusMatchId}
    />
  );
}

export default function DisplayPage() {
  return (
    <Suspense
      fallback={
        <main className="t-shell t-shell--display">
          <p className="t-display-empty">Lade Beamer-Ansicht …</p>
        </main>
      }
    >
      <DisplayPageInner />
    </Suspense>
  );
}
