"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PlayerNameSetup } from "@/components/PlayerNameSetup";
import { hasCompletedOwnNameSetup } from "@/lib/ownPlayerName";

type Props = {
  children: ReactNode;
};

export function PlayerNameGate({ children }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!hasCompletedOwnNameSetup());
  }, []);

  return (
    <>
      {children}
      {open ? <PlayerNameSetup onDone={() => setOpen(false)} /> : null}
    </>
  );
}
