"use client";

import { useState } from "react";
import Link from "next/link";
import { InviteQrCode } from "@/components/InviteQrCode";
import { buildInviteJoinUrl } from "@/lib/inviteJoinUrl";

type Props = {
  inviteCode?: string | null;
  useStrategyRules: boolean;
  rollsInPool: number;
  rollsRemaining: number | null;
  /** Wurf-Pool des Gegners (nur 2 Spieler + Host hat es erlaubt); sonst null. */
  opponentPool?: number | null;
  /** Host hat „Gegner-Pool sichtbar" aktiviert → Aktualisieren-Tap anzeigen. */
  showOpponentPoolControl?: boolean;
  /** Einzelner Lobby-Request auf Tippen (kein Polling). */
  onRefreshOpponentPool?: () => void;
  showAbandon?: boolean;
  abandonBusy?: boolean;
  onAbandon?: () => void;
};

export function PlayTopBar({
  inviteCode,
  useStrategyRules,
  rollsInPool,
  rollsRemaining,
  opponentPool,
  showOpponentPoolControl,
  onRefreshOpponentPool,
  showAbandon,
  abandonBusy,
  onAbandon,
}: Props) {
  const [showQr, setShowQr] = useState(false);
  const joinUrl = inviteCode ? buildInviteJoinUrl(inviteCode) : null;

  return (
    <div className="play-top-bar shrink-0">
      <div className="play-top-bar-start">
        {inviteCode && (
          <>
            <Link
              href={`/multi/join?code=${encodeURIComponent(inviteCode)}`}
              className="app-nav-btn"
            >
              <span aria-hidden className="app-nav-btn-icon">
                ←
              </span>
              <span>Zur Lobby</span>
            </Link>
            <button
              type="button"
              className="play-qr-btn"
              onClick={() => setShowQr(true)}
              aria-label="QR-Code zum Beitreten zeigen"
              title="QR-Code erneut zeigen"
            >
              <QrIcon />
              <span>QR</span>
            </button>
          </>
        )}
      </div>

      <div className="play-top-bar-end">
        {useStrategyRules && rollsRemaining !== null && (
          <div className="play-top-chips">
            <span className="play-chip">
              Pool <strong className="tabular-nums">{rollsInPool}</strong>
            </span>
            {opponentPool !== null && opponentPool !== undefined && (
              <span className="play-chip play-chip--sky">
                Gegner <strong className="tabular-nums">{opponentPool}</strong>
              </span>
            )}
            {showOpponentPoolControl && onRefreshOpponentPool && (
              <button
                type="button"
                onClick={onRefreshOpponentPool}
                className="play-chip-refresh"
                aria-label="Gegner-Pool aktualisieren"
                title="Gegner-Pool aktualisieren"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="play-chip-refresh-icon"
                  aria-hidden
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 12a8 8 0 0 1 13.66-5.66L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.66 5.66L4 16M4 20v-4h4"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        {showAbandon && onAbandon && (
          <button
            type="button"
            disabled={abandonBusy}
            onClick={onAbandon}
            className="play-abandon-btn disabled:opacity-50"
            title="Spiel beenden"
            aria-label="Spiel beenden"
          >
            <svg
              viewBox="0 0 24 24"
              className="play-abandon-icon"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        )}
      </div>

      {showQr && inviteCode && joinUrl && (
        <div
          className="play-invite-qr-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="play-invite-qr-title"
        >
          <button
            type="button"
            className="play-invite-qr-backdrop"
            aria-label="Schließen"
            onClick={() => setShowQr(false)}
          />
          <div className="play-invite-qr-card">
            <p className="play-invite-qr-kicker">Multiplayer</p>
            <h2 id="play-invite-qr-title" className="play-invite-qr-title">
              Spiel beitreten
            </h2>
            <p className="play-invite-qr-hint">
              Späterer Mitspieler scannt denselben QR wie beim Anlegen.
            </p>
            <div className="play-invite-qr-frame">
              <InviteQrCode
                value={joinUrl}
                label={`QR-Code zum Beitreten, Raum ${inviteCode}`}
                size={228}
              />
            </div>
            <button
              type="button"
              className="glass-button min-h-10 w-full px-4 text-sm font-semibold"
              onClick={() => setShowQr(false)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QrIcon() {
  return (
    <svg className="play-qr-btn-icon" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
