"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Alte Rivalen-Verwaltung: Namen kommen vom Server, Fotos in der Statistik. */
export default function RivalsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/stats");
  }, [router]);
  return null;
}
