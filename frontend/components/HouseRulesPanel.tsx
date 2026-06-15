"use client";

import { useState } from "react";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import type { RunDto } from "@/lib/types";
import {
  HouseRulesTableActions,
  isExtraHouseRulesUiAvailable,
} from "@/components/HouseRulesTableActions";

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

  if (!isExtraHouseRulesUiAvailable(isLocalSolo, run.useStrategyRules)) {
    return null;
  }

  return (
    <div className="house-rules-slot shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="house-rules-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        Zusatzregeln
      </button>

      {open && (
        <>
          <button
            type="button"
            className="house-rules-slot-backdrop"
            aria-label="Zusatzregeln schließen"
            onClick={() => setOpen(false)}
          />
          <div className="house-rules-popover" role="dialog" aria-label="Zusatzregeln">
            <div className="house-rules-popover-head">
              <p className="house-rules-panel-title text-xs font-semibold uppercase tracking-wide">
                Zusatzregeln
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="house-rules-panel-close"
              >
                Schließen
              </button>
            </div>
            <HouseRulesTableActions
              run={run}
              inviteCode={inviteCode}
              lobby={lobby}
              isLocalSolo={isLocalSolo}
              ownPlayerDbId={ownPlayerDbId}
              busy={busy}
              onRollSale={onRollSale}
              onYatzyStreak={onYatzyStreak}
              variant="popover"
            />
          </div>
        </>
      )}
    </div>
  );
}
