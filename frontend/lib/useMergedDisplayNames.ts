"use client";

import { useEffect, useState } from "react";
import type { PlayerAliasMap } from "@/lib/playerAliases";
import {
  loadMergedDisplayNames,
  overlayDisplayNames,
} from "@/lib/displayNameMerge";
import { normalizePublicPlayerId } from "@/lib/playerIdentity";
import { subscribeOwnPlayerName } from "@/lib/ownPlayerName";
import { loadDisplayNames, subscribeRivalProfiles } from "@/lib/rivalProfiles";

export function useMergedDisplayNames(extraIds: string[] = []): PlayerAliasMap {
  const extraKey = extraIds
    .map((id) => normalizePublicPlayerId(id))
    .filter(Boolean)
    .sort()
    .join(",");
  const [names, setNames] = useState<PlayerAliasMap>(() =>
    overlayDisplayNames(loadDisplayNames(), {}),
  );

  useEffect(() => {
    let cancelled = false;
    const extra = extraKey ? extraKey.split(",") : [];

    function refresh() {
      void loadMergedDisplayNames(extra).then((merged) => {
        if (!cancelled) setNames(merged);
      });
    }

    refresh();
    const unsubRivals = subscribeRivalProfiles(refresh);
    const unsubName = subscribeOwnPlayerName(refresh);
    return () => {
      cancelled = true;
      unsubRivals();
      unsubName();
    };
  }, [extraKey]);

  return names;
}
