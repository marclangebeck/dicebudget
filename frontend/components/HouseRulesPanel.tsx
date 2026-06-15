"use client";

import { useState } from "react";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import type { RunDto } from "@/lib/types";
import { isFeatureEnabled } from "@/lib/featureFlags";
import {
  BURN_POOL_COST,
  qualifiesYatzyStreakPenalty,
} from "@/lib/houseRules";
import { RollSaleOverlay } from "@/components/RollSaleOverlay";

type HouseRulesPanelProps = {
  run: RunDto;
  inviteCode?: string;
  lobby: SessionLobbyDto | null;
  activeFieldId: string | null;
  rollsUsed: number | null;
  isLocalSolo: boolean;
  ownPlayerDbId?: string;
  busy: boolean;
  onBurn: (fieldId: string) => void;
  onRollSale: (sellerPlayerId: string, buyerPlayerId: string, pools: number) => void;
  onYatzyStreak: (victimPlayerId: string) => void;
};

export function HouseRulesPanel({
  run,
  inviteCode,
  lobby,
  activeFieldId,
  rollsUsed,
  isLocalSolo,
  ownPlayerDbId,
  busy,
  onBurn,
  onRollSale,
  onYatzyStreak,
}: HouseRulesPanelProps) {
  const [open, setOpen] = useState(false);
  const [rollSaleOpen, setRollSaleOpen] = useState(false);
  const [yatzyVictimId, setYatzyVictimId] = useState("");

  const burnEnabled = isFeatureEnabled("houseRulesBurn");
  const rollSaleEnabled = isFeatureEnabled("houseRulesRollSale");
  const yatzyEnabled = isFeatureEnabled("houseRulesYatzyStreak");

  if (!run.useStrategyRules || (!burnEnabled && !rollSaleEnabled && !yatzyEnabled)) {
    return null;
  }

  const atThrowStart =
    !!activeFieldId &&
    rollsUsed === null &&
    run.games
      .flatMap((g) => g.fields)
      .some((f) => f.id === activeFieldId && f.score === null && f.rollsUsed === 0);

  const canBurn =
    burnEnabled && atThrowStart && run.rollsInPool >= BURN_POOL_COST && run.status === "ACTIVE";

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
          className="glass-button w-full min-h-9 px-3 text-xs font-semibold text-slate-200"
        >
          Hausregeln
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="house-rules-panel shrink-0 rounded-xl border border-white/10 bg-black/20 p-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hausregeln</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-slate-400 underline"
          >
            Schließen
          </button>
        </div>

        {run.rollSaleFreeFillActive && (
          <p className="mb-2 rounded-lg bg-emerald-500/15 px-2 py-1.5 text-xs text-emerald-100">
            Verkaufs-Freifeld aktiv: Feld wählen und erlaubten Wert eintragen (0 Würfe).
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          {burnEnabled && (
            <button
              type="button"
              disabled={busy || !canBurn || !activeFieldId}
              onClick={() => activeFieldId && onBurn(activeFieldId)}
              className="glass-button min-h-9 px-3 text-left text-xs font-semibold disabled:opacity-45"
            >
              Brennt (−{BURN_POOL_COST} Pool)
              {!atThrowStart && (
                <span className="block font-normal text-slate-400">Nur am Wurfbeginn</span>
              )}
            </button>
          )}

          {rollSaleEnabled && multi && (
            <button
              type="button"
              disabled={busy || !canRollSale}
              onClick={() => setRollSaleOpen(true)}
              className="glass-button min-h-9 px-3 text-left text-xs font-semibold disabled:opacity-45"
            >
              Wurf verkaufen
              <span className="block font-normal text-slate-400">
                Verkäufer braucht eine volle Feldzeile
              </span>
            </button>
          )}

          {yatzyEnabled && multi && (
            <div className="rounded-lg border border-white/5 p-2">
              <p className="text-xs font-semibold text-slate-200">2× Alle Fünfe (≤3 Würfe)</p>
              <p className="mt-0.5 text-[0.65rem] text-slate-400">
                Gegner verliert die Hälfte des Pools (abrunden).
              </p>
              {canYatzyStreak ? (
                <div className="mt-2 flex gap-2">
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
                  <button
                    type="button"
                    disabled={busy || opponents.length === 0}
                    onClick={() => {
                      const id = yatzyVictimId || opponents[0]?.id;
                      if (id) onYatzyStreak(id);
                    }}
                    className="glass-button glass-button--primary min-h-9 shrink-0 px-3 text-xs font-semibold"
                  >
                    Anwenden
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-[0.65rem] text-slate-500">
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
