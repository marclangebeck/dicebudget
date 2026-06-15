"use client";

import { useState } from "react";
import type { SessionLobbyDto } from "@/lib/sessionTypes";

type RollSaleOverlayProps = {
  open: boolean;
  lobby: SessionLobbyDto;
  defaultSellerId?: string;
  maxPools: number;
  onClose: () => void;
  onConfirm: (sellerPlayerId: string, buyerPlayerId: string, pools: number) => void;
  busy?: boolean;
};

export function RollSaleOverlay({
  open,
  lobby,
  defaultSellerId,
  maxPools,
  onClose,
  onConfirm,
  busy,
}: RollSaleOverlayProps) {
  const players = lobby.players;
  const [sellerId, setSellerId] = useState(defaultSellerId ?? players[0]?.id ?? "");
  const [buyerId, setBuyerId] = useState(
    players.find((p) => p.id !== (defaultSellerId ?? players[0]?.id))?.id ?? "",
  );
  const [pools, setPools] = useState(1);

  if (!open) return null;

  const buyer = players.find((p) => p.id === buyerId);
  const buyerPool = buyer?.rollsInPool ?? maxPools;
  const poolMax = Math.max(1, Math.min(maxPools, buyerPool));

  return (
    <div
      className="field-entry-overlay fixed inset-0 z-[60] flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="roll-sale-title"
    >
      <button
        type="button"
        className="field-entry-overlay-backdrop absolute inset-0"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div className="field-entry-panel relative z-10 mx-4 mt-[max(1.5rem,env(safe-area-inset-top))] w-full max-w-md rounded-2xl border border-white/10 bg-[#1e2430] p-5 shadow-2xl">
        <h2 id="roll-sale-title" className="text-lg font-bold text-white">
          Wurf verkaufen
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Verkäufer braucht mindestens eine volle Feldzeile (z. B. alle Gr. Straßen). Käufer
          gibt Pool ab; Verkäufer trägt danach ein Freifeld ohne Würfeln ein.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-400">Verkäufer</span>
            <select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="glass-input min-h-11 w-full px-3 text-sm font-semibold"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  Spieler {p.orderIndex + 1} ({p.playerId})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-400">Käufer</span>
            <select
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              className="glass-input min-h-11 w-full px-3 text-sm font-semibold"
            >
              {players
                .filter((p) => p.id !== sellerId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    Spieler {p.orderIndex + 1} ({p.playerId})
                  </option>
                ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-400">
              Pool-Würfe (1–{poolMax})
            </span>
            <input
              type="range"
              min={1}
              max={poolMax}
              value={Math.min(pools, poolMax)}
              onChange={(e) => setPools(Number(e.target.value))}
              className="setup-host-range w-full"
            />
            <span className="text-sm font-semibold text-white tabular-nums">{pools}</span>
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="glass-button min-h-11 flex-1 px-4 text-sm font-semibold"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={busy || !sellerId || !buyerId || sellerId === buyerId}
            onClick={() => onConfirm(sellerId, buyerId, Math.min(pools, poolMax))}
            className="glass-button glass-button--primary min-h-11 flex-1 px-4 text-sm font-semibold"
          >
            Verkauf buchen
          </button>
        </div>
      </div>
    </div>
  );
}
