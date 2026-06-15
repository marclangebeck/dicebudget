"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FeedbackRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  useEffect(() => {
    const target =
      from === "solo" || from === "multi" ? `/settings?from=${from}` : "/settings";
    router.replace(target);
  }, [from, router]);

  return null;
}

/** Legacy-Route: Feedback lebt jetzt auf der Haupt-Einstellungsseite. */
export default function FeedbackSettingsPage() {
  return (
    <Suspense fallback={null}>
      <FeedbackRedirectInner />
    </Suspense>
  );
}
