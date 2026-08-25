"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { InviteQrCode } from "@/components/InviteQrCode";
import { RollSaleOverlay } from "@/components/RollSaleOverlay";
import { buildInviteJoinUrl } from "@/lib/inviteJoinUrl";
import type { SessionLobbyDto } from "@/lib/sessionTypes";

type Props = {
  inviteCode?: string | null;
  useStrategyRules: boolean;
  rollsInPool: number;
  rollsRemaining: number | null;
  ownOpenUpperFields?: number;
  opponentPool?: number | null;
  opponentOpenUpperFields?: number | null;
  showOpponentPoolControl?: boolean;
  onRefreshOpponentPool?: () => void;
  showAbandon?: boolean;
  abandonBusy?: boolean;
  onAbandon?: () => void;
  /** B1: Wurf verkaufen im HH-Menü statt Zusatzregeln-Zeile */
  showRollSale?: boolean;
  canRollSale?: boolean;
  rollSaleFreeFillActive?: boolean;
  lobby?: SessionLobbyDto | null;
  ownPlayerDbId?: string;
  onRollSale?: (sellerPlayerId: string, buyerPlayerId: string, pools: number) => void;
};

export function PlayTopBar({
  inviteCode,
  useStrategyRules,
  rollsInPool,
  rollsRemaining,
  ownOpenUpperFields = 0,
  opponentPool,
  opponentOpenUpperFields,
  showOpponentPoolControl,
  onRefreshOpponentPool,
  showAbandon,
  abandonBusy,
  onAbandon,
  showRollSale,
  canRollSale,
  rollSaleFreeFillActive,
  lobby,
  ownPlayerDbId,
  onRollSale,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [rollSaleOpen, setRollSaleOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const joinUrl = inviteCode ? buildInviteJoinUrl(inviteCode) : null;

  const showOpponentStats =
    useStrategyRules &&
    rollsRemaining !== null &&
    !!showOpponentPoolControl &&
    opponentPool !== null &&
    opponentPool !== undefined;

  const showOpenUpperStats =
    showOpponentStats &&
    ownOpenUpperFields > 0 &&
    opponentOpenUpperFields != null &&
    opponentOpenUpperFields > 0;

  const showRefresh = !!onRefreshOpponentPool && !!showOpponentPoolControl && useStrategyRules;
  const showLobby = !!inviteCode;
  const showQrItem = !!inviteCode && !!joinUrl;
  const showRollSaleItem = !!showRollSale && !!onRollSale && !!lobby;
  const showAbandonItem = !!showAbandon && !!onAbandon;
  const hasMenu =
    showLobby || showQrItem || showRefresh || showRollSaleItem || showAbandonItem;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = menuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <div className="play-top-bar shrink-0">
        {hasMenu && (
          <div className="play-hh-wrap" ref={menuRef}>
            <button
              type="button"
              className="play-hh-btn"
              aria-label="Spielmenü"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="play-hh-icon" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>

            {menuOpen && (
              <div id={menuId} className="play-hh-menu" role="menu">
                {showLobby && (
                  <Link
                    href={`/multi/join?code=${encodeURIComponent(inviteCode!)}`}
                    className="play-hh-item"
                    role="menuitem"
                    onClick={closeMenu}
                  >
                    Zur Lobby
                  </Link>
                )}
                {showQrItem && (
                  <button
                    type="button"
                    className="play-hh-item"
                    role="menuitem"
                    onClick={() => {
                      closeMenu();
                      setShowQr(true);
                    }}
                  >
                    QR-Code anzeigen
                  </button>
                )}
                {showRefresh && (
                  <button
                    type="button"
                    className="play-hh-item"
                    role="menuitem"
                    onClick={() => {
                      closeMenu();
                      onRefreshOpponentPool?.();
                    }}
                  >
                    Aktualisieren
                  </button>
                )}
                {showRollSaleItem && (
                  <button
                    type="button"
                    className="play-hh-item"
                    role="menuitem"
                    disabled={abandonBusy || !canRollSale}
                    onClick={() => {
                      if (!canRollSale) return;
                      closeMenu();
                      setRollSaleOpen(true);
                    }}
                  >
                    Wurf verkaufen
                  </button>
                )}
                {showAbandonItem && (
                  <button
                    type="button"
                    className="play-hh-item play-hh-item--danger"
                    role="menuitem"
                    disabled={abandonBusy}
                    onClick={() => {
                      closeMenu();
                      onAbandon?.();
                    }}
                  >
                    Beenden
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {showOpponentStats && (
          <>
            <span
              className="play-top-stat play-top-stat--pool tabular-nums"
              title={`Pool ${rollsInPool} / ${opponentPool}`}
              aria-label={`Pool ${rollsInPool} zu ${opponentPool}`}
            >
              {rollsInPool} / {opponentPool}
            </span>
            {showOpenUpperStats && (
              <span
                className="play-top-stat play-top-stat--upper tabular-nums"
                title={`Oben offen ${ownOpenUpperFields} / ${opponentOpenUpperFields}`}
                aria-label={`Oben offen ${ownOpenUpperFields} zu ${opponentOpenUpperFields}`}
              >
                {ownOpenUpperFields} / {opponentOpenUpperFields}
              </span>
            )}
          </>
        )}

        <span className="play-top-bar-spacer" aria-hidden />
      </div>

      {rollSaleFreeFillActive && (
        <p className="play-roll-sale-banner shrink-0" role="status">
          Verkaufs-Freifeld aktiv: Feld wählen und erlaubten Wert eintragen (0 Würfe).
        </p>
      )}

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

      {lobby && onRollSale && (
        <RollSaleOverlay
          open={rollSaleOpen}
          lobby={lobby}
          defaultSellerId={ownPlayerDbId}
          maxPools={Math.max(...lobby.players.map((p) => p.rollsInPool ?? 0), 1)}
          busy={abandonBusy}
          onClose={() => setRollSaleOpen(false)}
          onConfirm={(seller, buyer, pools) => {
            onRollSale(seller, buyer, pools);
            setRollSaleOpen(false);
          }}
        />
      )}
    </>
  );
}
