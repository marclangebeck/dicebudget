"use client";

import { useState } from "react";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import type { RunDto } from "@/lib/types";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { qualifiesYatzyStreakPenalty } from "@/lib/houseRules";
import { RollSaleOverlay } from "@/components/RollSaleOverlay";

type HouseRulesPanelProps = {
  run: RunDto;
  inviteCode?: string;
  lobby: SessionLobbyDto | null;
  isLocalSolo: boolean;
  ownPlayerDbId?: string;
  busy: boolean;
  onRollSale: (sellerPlayerId: string, buyerPlayerId: string, pools: number) => void;
  onYatzyStreak: (victimPlayerId: string) => void;
};

export function HouseRulesPanel({
  run,
  inviteCode,
  lobby,
  isLocalSolo,
  ownPlayerDbId,
  busy,
  onRollSale,
  onYatzyStreak,
}: HouseRulesPanelProps) {
  const [open, setOpen] = useState(false);
  const [rollSaleOpen, setRollSaleOpen] = useState(false);
  const [yatzyVictimId, setYatzyVictimId] = useState("");

  const rollSaleEnabled = isFeatureEnabled("houseRulesRollSale");
  const yatzyEnabled = isFeatureEnabled("houseRulesYatzyStreak");

  if (!run.useStrategyRules || (!rollSaleEnabled && !yatzyEnabled)) {
    return null;
  }

  const multi = !isLocalSolo && !!inviteCode && lobby && lobby.playerCount >= 2;

  const canRollSale =
    rollSaleEnabled && multi && run.status === "ACTIVE" && !run.rollSaleFreeFillActive;

  const allFields = run.games.flatMap((g) => g.fields);
  const canYatzyStreak =
    yatzyEnabled && multi && run.status === "ACTIVE" && qualifiesYatzyStreakPenalty(allFields);

  const opponents = lobby?.players.filter((p) => p.id !== ownPlayerDbId) ?? [];

  if (!open) {
    return (
      <div className="house-rules-bar shrink-0 px-1 pb-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="house-rules-toggle w-full min-h-9 px-3 text-xs font-semibold"
        >
          Tischregeln
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="house-rules-panel shrink-0 rounded-xl border p-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="house-rules-panel-title text-xs font-semibold uppercase tracking-wide">
            Tischregeln
          </p>
          <button type="button" onClick={() => setOpen(false)} className="house-rules-panel-close">
            Schließen
          </button>
        </div>

        {run.rollSaleFreeFillActive && (
          <p className="house-rules-banner mb-2 rounded-lg px-2 py-1.5 text-xs">
            Verkaufs-Freifeld aktiv: Feld wählen und erlaubten Wert eintragen (0 Würfe).
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          {rollSaleEnabled && multi && (
            <button
              type="button"
              disabled={busy || !canRollSale}
              onClick={() => setRollSaleOpen(true)}
              className="house-rules-action min-h-9 px-3 text-left text-xs font-semibold disabled:opacity-45"
            >
              Wurf verkaufen
              <span className="house-rules-action-hint block font-normal">
                Verkäufer braucht eine volle Feldzeile
              </span>
            </button>
          )}

          {yatzyEnabled && multi && (
            <div className="house-rules-subpanel rounded-lg border p-2">
              <p className="text-xs font-semibold">2× Alle Fünfe (≤3 Würfe)</p>
              <p className="house-rules-action-hint mt-0.5 text-[0.65rem]">
                Gegner verliert die Hälfte des Pools (abrunden).
              </p>
              {canYatzyStreak ? (
                <div className="mt-2 flex gap-2">
                  {opponents.length === 1 ? (
                    <p className="house-rules-action-hint flex-1 text-xs">
                      Gegner: Spieler {opponents[0]!.orderIndex + 1}
                    </p>
                  ) : (
                    <select
                      value={yatzyVictimId || opponents[0]?.id || ""}
                      onChange={(e) => setYatzyVictimId(e.target.value)}
                      className="glass-input min-h-9 flex-1 px-2 text-xs"
                    >
                      {opponents.map((p) => (
                        <option key={p.id} value={p.id}>
                          Spieler {p.orderIndex + 1}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    disabled={busy || opponents.length === 0}
                    onClick={() => {
                      const id = yatzyVictimId || opponents[0]?.id;
                      if (id) onYatzyStreak(id);
                    }}
                    className="house-rules-action house-rules-action--primary min-h-9 shrink-0 px-3 text-xs font-semibold"
                  >
                    Anwenden
                  </button>
                </div>
              ) : (
                <p className="house-rules-action-hint mt-1 text-[0.65rem]">
                  Letzte zwei Einträge müssen Alle Fünfe mit ≤3 Würfen sein.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {lobby && (
        <RollSaleOverlay
          open={rollSaleOpen}
          lobby={lobby}
          defaultSellerId={ownPlayerDbId}
          maxPools={Math.max(...lobby.players.map((p) => p.rollsInPool ?? 0), 1)}
          busy={busy}
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
