"use client";

import { useState } from "react";
import Link from "next/link";
import { InviteQrCode } from "@/components/InviteQrCode";
import { buildInviteJoinUrl } from "@/lib/inviteJoinUrl";
import { shareInviteCode } from "@/lib/shareSocial";

type Props = {
  inviteCode: string;
  /** Extra class on outer success card */
  className?: string;
  lobbyLinkClassName?: string;
};

export function HostInviteQrPanel({
  inviteCode,
  className = "",
  lobbyLinkClassName = "setup-host-submit flex w-full items-center justify-center no-underline",
}: Props) {
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const joinUrl = buildInviteJoinUrl(inviteCode);

  async function handleShareCode() {
    setShareStatus(null);
    try {
      const result = await shareInviteCode(inviteCode);
      if (result === "shared") setShareStatus("Code geteilt");
      else if (result === "copied") setShareStatus("Code kopiert");
    } catch {
      setShareStatus("Teilen fehlgeschlagen");
    }
  }

  return (
    <div className={`setup-host-success setup-host-success--invite-qr ${className}`.trim()}>
      <div className="setup-host-invite-head">
        <p className="setup-host-invite-title">Spiel beitreten</p>
        <button
          type="button"
          className="setup-host-share-code-btn"
          onClick={() => void handleShareCode()}
        >
          Code teilen
        </button>
      </div>

      <div className="setup-host-qr-frame">
        <InviteQrCode value={joinUrl} label="QR-Code zum Beitreten" size={228} />
      </div>

      <div className="setup-host-code-block">
        <p className="setup-host-code-label">Raumcode</p>
        <p className="setup-host-code" aria-label={`Raumcode ${inviteCode}`}>
          {inviteCode}
        </p>
        <p className="setup-host-code-hint">
          Vor Ort: QR scannen. Remote: Code teilen oder abtippen.
        </p>
        {shareStatus && (
          <p className="setup-host-share-status" role="status">
            {shareStatus}
          </p>
        )}
      </div>

      <Link
        href={`/multi/join?code=${encodeURIComponent(inviteCode)}`}
        className={lobbyLinkClassName}
      >
        Zur Lobby (auch als Host)
      </Link>
    </div>
  );
}
