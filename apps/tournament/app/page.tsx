"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EventSetupCockpit } from "@/components/EventSetupCockpit";
import { HostCockpit } from "@/components/HostCockpit";
import { loadHostSession, type HostSession } from "@/lib/hostStore";

function TournamentHomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get("new") === "1";
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<HostSession | null>(null);

  useEffect(() => {
    setSession(loadHostSession());
    setReady(true);
  }, [forceNew]);

  if (!ready) {
    return <main className="t-shell">Lade…</main>;
  }

  if (session && !forceNew) {
    return (
      <HostCockpit
        inviteCode={session.inviteCode}
        onNewEvent={() => router.replace("/?new=1")}
        onSessionCleared={() => {
          setSession(null);
          router.replace("/");
        }}
      />
    );
  }

  return (
    <EventSetupCockpit
      onCreated={() => {
        setSession(loadHostSession());
        router.replace("/");
      }}
      onCancel={session ? () => router.replace("/") : undefined}
    />
  );
}

export default function TournamentHomePage() {
  return (
    <Suspense fallback={<main className="t-shell">Lade…</main>}>
      <TournamentHomeInner />
    </Suspense>
  );
}
