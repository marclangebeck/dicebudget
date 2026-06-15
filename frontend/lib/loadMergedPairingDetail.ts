import { getPairingDetail, getPairingSummaries } from "@/lib/api";
import type { PlayerAliasMap } from "@/lib/playerAliases";
import {
  isMergedPairingKey,
  mergePairingDetails,
  mergePairingSummaries,
  type MergedPairingSummary,
} from "@/lib/pairingMerge";
import type { PairingDetailDto, PairingSummaryDto } from "@/lib/pairingTypes";

export type MergedPairingDetailResult = {
  detail: PairingDetailDto;
  group: MergedPairingSummary;
  sources: PairingSummaryDto[];
};

export async function loadMergedPairingDetail(
  key: string,
  aliases: PlayerAliasMap,
  ownPlayerId: string,
): Promise<MergedPairingDetailResult> {
  const { pairings } = await getPairingSummaries();
  const mergedList = mergePairingSummaries(pairings, aliases, ownPlayerId);
  const matched = isMergedPairingKey(key)
    ? mergedList.find((m) => m.key === key)
    : mergedList.find((m) => m.sourceKeys.includes(key));
  if (!matched) throw new Error("Paarung nicht gefunden");

  const sources = pairings.filter((p) => matched.sourceKeys.includes(p.key));
  const details = await Promise.all(
    matched.sourceKeys.map((k) => getPairingDetail(k).then((r) => r.pairing)),
  );
  const merged = mergePairingDetails(details, aliases, ownPlayerId);
  if (!merged) throw new Error("Paarung nicht gefunden");

  return { detail: merged, group: matched, sources };
}
