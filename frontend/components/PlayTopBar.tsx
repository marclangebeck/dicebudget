"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { InviteQrCode } from "@/components/InviteQrCode";
import { RollSaleOverlay } from "@/components/RollSaleOverlay";
import { buildInviteJoinUrl } from "@/lib/inviteJoinUrl";
import { shareInviteCode } from "@/lib/shareSocial";
import type { SessionLobbyDto } from "@/lib/sessionTypes";

type Props = {
  inviteCode?: string | null;
  useStrategyRules: boolean;
  rollsInPool: number;
  rollsRemaining: number | null;
  ownOpenUpperFields?: number;
  /** Pools der Mitspieler (Reihenfolge wie in der Lobby, ohne dich). */
  opponentPools?: number[] | null;
  /** Offene Oberfelder der Mitspieler — parallel zu opponentPools. */
  opponentOpenUpperFieldsList?: number[] | null;
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

function formatOpponentStats(values: number[]): string {
  return values.join(" · ");
}

export function PlayTopBar({
  inviteCode,
  useStrategyRules,
  rollsInPool,
  rollsRemaining,
  ownOpenUpperFields = 0,
  opponentPools,
  opponentOpenUpperFieldsList,
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
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const joinUrl = inviteCode ? buildInviteJoinUrl(inviteCode) : null;

  const opponentPoolLabel =
    opponentPools && opponentPools.length > 0
      ? formatOpponentStats(opponentPools)
      : null;
  const opponentOpenUpperLabel =
    opponentOpenUpperFieldsList && opponentOpenUpperFieldsList.length > 0
      ? formatOpponentStats(opponentOpenUpperFieldsList)
      : null;
  const opponentOpenUpperTotal =
    opponentOpenUpperFieldsList?.reduce((sum, n) => sum + n, 0) ?? 0;

  const showOpponentStats =
    useStrategyRules &&
    rollsRemaining !== null &&
    !!showOpponentPoolControl &&
    opponentPoolLabel != null;

  const showOpenUpperStats =
    showOpponentStats &&
    ownOpenUpperFields > 0 &&
    opponentOpenUpperLabel != null &&
    opponentOpenUpperTotal > 0;

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
              title={`Pool ${rollsInPool} / ${opponentPoolLabel}`}
              aria-label={`Pool ${rollsInPool} zu ${opponentPoolLabel}`}
            >
              {rollsInPool} / {opponentPoolLabel}
            </span>
            {showOpenUpperStats && (
              <span
                className="play-top-stat play-top-stat--upper tabular-nums"
                title={`Oben offen ${ownOpenUpperFields} / ${opponentOpenUpperLabel}`}
                aria-label={`Oben offen ${ownOpenUpperFields} zu ${opponentOpenUpperLabel}`}
              >
                {ownOpenUpperFields} / {opponentOpenUpperLabel}
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
            <div className="play-invite-qr-head">
              <h2 id="play-invite-qr-title" className="play-invite-qr-title">
                Spiel beitreten
              </h2>
              <button
                type="button"
                className="setup-host-share-code-btn"
                onClick={() => {
                  void (async () => {
                    setShareStatus(null);
                    try {
                      const result = await shareInviteCode(inviteCode);
                      if (result === "shared") setShareStatus("Code geteilt");
                      else if (result === "copied") setShareStatus("Code kopiert");
                    } catch {
                      setShareStatus("Teilen fehlgeschlagen");
                    }
                  })();
                }}
              >
                Code teilen
              </button>
            </div>
            <p className="play-invite-qr-hint">
              Vor Ort: QR scannen. Remote: Code teilen oder abtippen.
            </p>
            <div className="play-invite-qr-frame">
              <InviteQrCode
                value={joinUrl}
                label={`QR-Code zum Beitreten, Raum ${inviteCode}`}
                size={228}
              />
            </div>
            <div className="setup-host-code-block">
              <p className="setup-host-code-label">Raumcode</p>
              <p className="setup-host-code" aria-label={`Raumcode ${inviteCode}`}>
                {inviteCode}
              </p>
              {shareStatus && (
                <p className="setup-host-share-status" role="status">
                  {shareStatus}
                </p>
              )}
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
