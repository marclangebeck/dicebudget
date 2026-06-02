"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlayBoard } from "@/components/PlayBoard";
import { TableModePlayBoard } from "@/components/TableModePlayBoard";
import { APP_HOME_PATH } from "@/lib/branding";
import {
  loadActiveGame,
  playPath,
  saveActiveGame,
  type ActiveGameState,
} from "@/lib/activeGame";

function PlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get("runId");
  const inviteFromUrl = searchParams.get("invite")?.trim() || undefined;
  const secretFromUrl = searchParams.get("playerSecret")?.trim() || undefined;
  const tableMode = searchParams.get("table") === "1";

  const [playerSecret, setPlayerSecret] = useState<string | undefined>(undefined);
  const [inviteCode, setInviteCode] = useState<string | undefined>(inviteFromUrl);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (tableMode) {
      setReady(true);
      return;
    }

    if (!runId) {
      const stored = loadActiveGame();
      if (stored) {
        router.replace(playPath(stored));
        return;
      }
      setReady(true);
      return;
    }

    if (secretFromUrl) {
      const invite = inviteFromUrl ?? "";
      const state: ActiveGameState = {
        type: "multi",
        runId,
        playerSecret: secretFromUrl,
        inviteCode: invite,
      };
      saveActiveGame(state);
      setPlayerSecret(secretFromUrl);
      setInviteCode(inviteFromUrl);
      router.replace(
        `/play?runId=${encodeURIComponent(runId)}${inviteFromUrl ? `&invite=${encodeURIComponent(inviteFromUrl)}` : ""}`,
      );
      setReady(true);
      return;
    }

    const stored = loadActiveGame();
    if (stored?.type !== "table" && stored?.runId === runId) {
      if (stored.type === "multi") {
        setPlayerSecret(stored.playerSecret);
        setInviteCode(inviteFromUrl ?? stored.inviteCode);
      } else {
        setPlayerSecret(undefined);
        setInviteCode(inviteFromUrl);
      }
    }
    setReady(true);
  }, [runId, secretFromUrl, inviteFromUrl, router, tableMode]);

  if (!ready) {
    return <p className="play-empty-state">Lade …</p>;
  }

  if (tableMode) {
    if (!inviteFromUrl) {
      return (
        <div className="play-message-card">
          <p className="text-muted text-sm">Kein Tischspiel geladen.</p>
          <Link href="/multi" className="play-top-link mt-2 inline-block">
            Raum erstellen
          </Link>
        </div>
      );
    }
    return <TableModePlayBoard inviteCode={inviteFromUrl} />;
  }

  if (!runId) {
    return (
      <div className="play-message-card">
        <p className="text-muted text-sm">Kein Spiel geladen.</p>
        <Link href={APP_HOME_PATH} className="play-top-link mt-2 inline-block">
          ← Start
        </Link>
      </div>
    );
  }

  const needsMpSecret = Boolean(inviteCode ?? inviteFromUrl);
  if (needsMpSecret && !playerSecret) {
    const code = inviteCode ?? inviteFromUrl;
    return (
      <div className="play-message-card">
        <p className="text-secondary text-sm">
          Sitzung abgelaufen. Bitte erneut über den Raum-Code in der Lobby beitreten.
        </p>
        {code ? (
          <Link
            href={`/multi/join?code=${encodeURIComponent(code)}`}
            className="play-top-link mt-3 inline-block"
          >
            Zur Lobby
          </Link>
        ) : null}
        <Link href={APP_HOME_PATH} className="play-top-link mt-2 inline-block">
          ← Start
        </Link>
      </div>
    );
  }

  return (
    <PlayBoard
      runId={runId}
      playerSecret={playerSecret}
      inviteCode={inviteCode ?? inviteFromUrl}
    />
  );
}

export default function PlayPage() {
  return (
    <div className="play-screen-inner pt-safe pb-safe flex min-h-0 flex-1 flex-col overflow-hidden px-2">
      <Suspense fallback={<p className="play-empty-state">Lade …</p>}>
        <PlayContent />
      </Suspense>
    </div>
  );
}
