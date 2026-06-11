"use client";

import { useEffect, useState } from "react";
import { HomeBentoGridClassic } from "@/components/HomeBentoGridClassic";
import { HomeBentoGridCinematic } from "@/components/HomeBentoGridCinematic";
import { getHomeLayoutFromEnv, resolveHomeLayout, type HomeLayoutMode } from "@/lib/homeLayout";

export function HomeBentoGrid() {
  const [layout, setLayout] = useState<HomeLayoutMode>(() => getHomeLayoutFromEnv());

  useEffect(() => {
    setLayout(resolveHomeLayout());
  }, []);

  if (layout === "classic") {
    return <HomeBentoGridClassic />;
  }

  return <HomeBentoGridCinematic />;
}
