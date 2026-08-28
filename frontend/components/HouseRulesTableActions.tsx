"use client";

import { useState } from "react";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import type { RunDto } from "@/lib/types";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { getHouseRuleInfo, type HouseRuleInfo } from "@/lib/houseRuleInfo";
import { HouseRuleInfoOverlay } from "@/components/HouseRuleInfoOverlay";
import { RollSaleOverlay } from "@/components/RollSaleOverlay";

export function isExtraHouseRulesUiAvailable(isLocalSolo: boolean, useStrategyRules: boolean): boolean {
  if (!useStrategyRules) return false;
  if (
    !isFeatureEnabled("houseRulesRollSale") &&
    !isFeatureEnabled("houseRulesYatzyStreak") &&
    !isFeatureEnabled("houseRulesYatzyTriple") &&
    !isFeatureEnabled("houseRulesUpperRace") &&
    !isFeatureEnabled("houseRulesColumnPoolBonuses")
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
  onYatzyStreak: _onYatzyStreak,
  variant = "popover",
}: HouseRulesTableActionsProps) {
  const [rollSaleOpen, setRollSaleOpen] = useState(false);
  const [ruleInfo, setRuleInfo] = useState<HouseRuleInfo | null>(null);

  const rollSaleEnabled = isFeatureEnabled("houseRulesRollSale");
  const yatzyEnabled = isFeatureEnabled("houseRulesYatzyStreak");
  const yatzyTripleEnabled = isFeatureEnabled("houseRulesYatzyTriple");
  const upperRaceEnabled = isFeatureEnabled("houseRulesUpperRace");
  const columnPoolEnabled = isFeatureEnabled("houseRulesColumnPoolBonuses");

  if (!isExtraHouseRulesUiAvailable(isLocalSolo, run.useStrategyRules)) {
    return null;
  }

  const multi = !isLocalSolo && !!inviteCode && lobby && lobby.playerCount >= 2;
  if (!multi) return null;

  const canRollSale =
    rollSaleEnabled && run.status === "ACTIVE" && !run.rollSaleFreeFillActive;

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

        {yatzyEnabled && lobby && lobby.playerCount >= 2 && (
          <div className="house-rules-subpanel rounded-lg border p-2">
            <RuleTitle title="2× Alle Fünfe" infoKey="yatzyStreak2" onInfo={setRuleInfo} />
            <p className="house-rules-action-hint mt-0.5 text-[0.65rem]">
              ≤3 Würfe: Mitspieler verlieren je 1/{lobby.playerCount} Pool (automatisch)
              {lobby.ruleYatzyStreak2Credit ? "; Abzug wird dir gutgeschrieben" : ""}.
            </p>
          </div>
        )}

        {yatzyTripleEnabled && lobby && lobby.playerCount >= 2 && (
          <div className="house-rules-subpanel rounded-lg border p-2">
            <RuleTitle title="3× Alle Fünfe" infoKey="yatzyStreak3" onInfo={setRuleInfo} />
            <p className="house-rules-action-hint mt-0.5 text-[0.65rem]">
              ≤3 Würfe: Mitspieler verlieren den gesamten Pool (automatisch)
              {lobby.ruleYatzyTripleCredit ? "; Abzug wird dir gutgeschrieben" : ""}.
            </p>
          </div>
        )}

        {upperRaceEnabled && lobby && lobby.playerCount >= 2 && (
          <div className="house-rules-subpanel rounded-lg border p-2">
            <RuleTitle title="Oberer Bereich zuerst" infoKey="upperRace" onInfo={setRuleInfo} />
            <p className="house-rules-action-hint mt-0.5 text-[0.65rem]">
              Offene obere Felder der Mitspieler als Pool (automatisch).
            </p>
          </div>
        )}

        {columnPoolEnabled && (
          <div className="house-rules-subpanel rounded-lg border p-2">
            <RuleTitle title="Spalten-Pool-Boni" infoKey="columnPoolBonuses" onInfo={setRuleInfo} />
            <p className="house-rules-action-hint mt-0.5 text-[0.65rem]">
              Erster: Spalte oben mit Bonus / unten voll / durchgängig — je +2 Pool (auto).
            </p>
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
