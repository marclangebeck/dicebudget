"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeInviteCode } from "@/lib/activeGame";

type Props = {
  variant?: "card" | "compact" | "inline" | "home";
};

export function JoinByCodeForm({ variant = "card" }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeInviteCode(code);
    if (normalized.length < 6) {
      setError("Bitte den vollständigen Raum-Code eingeben.");
      return;
    }
    setError(null);
    router.push(`/multi/join?code=${encodeURIComponent(normalized)}`);
  }

  if (variant === "home") {
    return (
      <section className="home-cinematic-join" aria-label="Multi-Spiel beitreten">
        <div className="home-cinematic-join-copy">
          <p className="home-cinematic-join-kicker">Multi-Spiel</p>
          <p className="home-cinematic-join-title">Mit Code beitreten</p>
        </div>
        <form onSubmit={handleSubmit} className="home-cinematic-join-form">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            aria-label="Raum-Code vom Host"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={12}
            placeholder="Code"
            className="home-bento-input home-cinematic-join-input"
          />
          <button type="submit" className="home-bento-submit home-cinematic-join-submit">
            Beitreten
          </button>
        </form>
        {error && <p className="home-cinematic-join-error">{error}</p>}
      </section>
    );
  }

  const form = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-secondary">Raum-Code vom Host</span>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={12}
          placeholder="z. B. ABCD2345"
          className="glass-input px-3 py-3 text-center font-mono text-lg tracking-widest"
        />
      </label>
      {error && <p className="glass-alert-error text-sm">{error}</p>}
      <button type="submit" className="btn-sky min-h-11 py-2.5 text-sm">
        Zur Lobby
      </button>
    </form>
  );

  if (variant === "inline") {
    return form;
  }

  if (variant === "compact") {
    return (
      <section className="glass-panel-sky shrink-0 px-3 py-3">
        <h2 className="text-link text-sm font-semibold">Raum beitreten</h2>
        <div className="mt-2">{form}</div>
      </section>
    );
  }

  return (
    <section className="glass-panel-sky px-4 py-4">
      <h2 className="text-link text-sm font-semibold">Raum beitreten</h2>
      <p className="text-muted mt-1 mb-3 text-xs">
        Code vom Host eingeben – du bleibst in der App.
      </p>
      {form}
    </section>
  );
}
