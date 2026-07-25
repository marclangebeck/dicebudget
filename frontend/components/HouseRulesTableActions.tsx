"use client";

import { useState } from "react";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import type { RunDto } from "@/lib/types";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { getHouseRuleInfo, type HouseRuleInfo } from "@/lib/houseRuleInfo";
import { qualifiesYatzyStreakPenalty } from "@/lib/houseRules";
import { HouseRuleInfoOverlay } from "@/components/HouseRuleInfoOverlay";
import { RollSaleOverlay } from "@/components/RollSaleOverlay";

export function isExtraHouseRulesUiAvailable(isLocalSolo: boolean, useStrategyRules: boolean): boolean {
  if (!useStrategyRules) return false;
  if (
    !isFeatureEnabled("houseRulesRollSale") &&
    !isFeatureEnabled("houseRulesYatzyStreak") &&
    !isFeatureEnabled("houseRulesYatzyTriple") &&
    !isFeatureEnabled("houseRulesUpperRace")
  ) {
    return false;
  }
  return !isLocalSolo;
}

type HouseRulesTableActionsProps = {
  run: RunDto;
  inviteCode?: string;
  lobby: SessionLobbyDto | null;
  isLocalSolo: boolean;
  ownPlayerDbId?: string;
  busy: boolean;
  onRollSale: (sellerPlayerId: string, buyerPlayerId: string, pools: number) => void;
  onYatzyStreak: (victimPlayerId: string) => void;
  /** entry = im Wurf-Overlay; popover = am Zettel */
  variant?: "entry" | "popover";
};

function RuleTitle({
  title,
  infoKey,
  onInfo,
}: {
  title: string;
  infoKey: string;
  onInfo: (info: HouseRuleInfo) => void;
}) {
  return (
    <p className="text-xs font-semibold settings-rule-title-row">
      <span>{title}</span>
      <button
        type="button"
        className="house-rule-info-btn"
        aria-label={`Info zu ${title}`}
        onClick={() => {
          const info = getHouseRuleInfo(infoKey);
          if (info) onInfo(info);
        }}
      >
        i
      </button>
    </p>
  );
}

export function HouseRulesTableActions({
  run,
  inviteCode,
  lobby,
  isLocalSolo,
  ownPlayerDbId,
  busy,
  onRollSale,
  onYatzyStreak,
  variant = "popover",
}: HouseRulesTableActionsProps) {
  const [rollSaleOpen, setRollSaleOpen] = useState(false);
  const [yatzyVictimId, setYatzyVictimId] = useState("");
  const [ruleInfo, setRuleInfo] = useState<HouseRuleInfo | null>(null);

  const rollSaleEnabled = isFeatureEnabled("houseRulesRollSale");
  const yatzyEnabled = isFeatureEnabled("houseRulesYatzyStreak");
  const yatzyTripleEnabled = isFeatureEnabled("houseRulesYatzyTriple");
  const upperRaceEnabled = isFeatureEnabled("houseRulesUpperRace");

  if (!isExtraHouseRulesUiAvailable(isLocalSolo, run.useStrategyRules)) {
    return null;
  }

  const multi = !isLocalSolo && !!inviteCode && lobby && lobby.playerCount >= 2;
  if (!multi) return null;

  const canRollSale =
    rollSaleEnabled && run.status === "ACTIVE" && !run.rollSaleFreeFillActive;

  const allFields = run.games.flatMap((g) => g.fields);
  const canYatzyStreak =
    yatzyEnabled && run.status === "ACTIVE" && qualifiesYatzyStreakPenalty(allFields);

  const opponents = lobby?.players.filter((p) => p.id !== ownPlayerDbId) ?? [];
  const rootClass =
    variant === "entry" ? "house-rules-actions house-rules-actions--entry" : "house-rules-actions";

  return (
    <>
      <div className={rootClass}>
        {run.rollSaleFreeFillActive && (
          <p className="house-rules-banner text-xs">
            Verkaufs-Freifeld aktiv: Feld wählen und erlaubten Wert eintragen (0 Würfe).
          </p>
        )}

        {rollSaleEnabled && (
          <button
            type="button"
            disabled={busy || !canRollSale}
            onClick={() => setRollSaleOpen(true)}
            className="house-rules-action min-h-9 px-3 text-left text-xs font-semibold disabled:opacity-45"
          >
            <span className="settings-rule-title-row">
              Wurf verkaufen
              <span
                role="button"
                tabIndex={0}
                className="house-rule-info-btn"
                aria-label="Info zu Wurf verkaufen"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRuleInfo(getHouseRuleInfo("rollSale"));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    setRuleInfo(getHouseRuleInfo("rollSale"));
                  }
                }}
              >
                i
              </span>
            </span>
            <span className="house-rules-action-hint block font-normal">
              Verkäufer braucht eine volle Feldzeile
            </span>
          </button>
        )}

        {yatzyEnabled && lobby && lobby.playerCount === 2 && (
          <div className="house-rules-subpanel rounded-lg border p-2">
            <RuleTitle title="2× Alle Fünfe" infoKey="yatzyStreak2" onInfo={setRuleInfo} />
            <p className="house-rules-action-hint mt-0.5 text-[0.65rem]">
              ≤3 Würfe: Pool-Strafe wird automatisch angewendet.
            </p>
          </div>
        )}

        {yatzyTripleEnabled && lobby && lobby.playerCount === 2 && (
          <div className="house-rules-subpanel rounded-lg border p-2">
            <RuleTitle title="3× Alle Fünfe" infoKey="yatzyStreak3" onInfo={setRuleInfo} />
            <p className="house-rules-action-hint mt-0.5 text-[0.65rem]">
              ≤3 Würfe: Gegner verliert den gesamten Pool (automatisch).
            </p>
          </div>
        )}

        {upperRaceEnabled && lobby && lobby.playerCount === 2 && (
          <div className="house-rules-subpanel rounded-lg border p-2">
            <RuleTitle title="Oberer Bereich zuerst" infoKey="upperRace" onInfo={setRuleInfo} />
            <p className="house-rules-action-hint mt-0.5 text-[0.65rem]">
              Offene obere Felder des Rivalen als Pool (automatisch).
            </p>
          </div>
        )}

        {yatzyEnabled && lobby && lobby.playerCount > 2 && (
          <div className="house-rules-subpanel rounded-lg border p-2">
            <RuleTitle title="2× Alle Fünfe (≤3 Würfe)" infoKey="yatzyStreak2" onInfo={setRuleInfo} />
            <p className="house-rules-action-hint mt-0.5 text-[0.65rem]">
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
      <HouseRuleInfoOverlay info={ruleInfo} onClose={() => setRuleInfo(null)} />
    </>
  );
}
