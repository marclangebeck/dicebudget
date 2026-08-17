"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTournament } from "@/lib/api";
import { APP_NAME } from "@/lib/branding";
import {
  buildEventConfigPayload,
  formatGroupPreview,
  matchModeLabel,
  type LeagueSettings,
  type MatchPrefs,
  type TurnierSettings,
} from "@/lib/eventConfig";
import { saveHostSession } from "@/lib/hostStore";
import { clearSetupDraft, loadSetupDraft } from "@/lib/setupDraft";
import { TOURNAMENT_MODE_OPTIONS } from "@/lib/tournamentModes";

export default function SetupReviewPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [modeKey, setModeKey] = useState<"league" | "turnier" | null>(null);
  const [modeLabel, setModeLabel] = useState("");
  const [maxEntries, setMaxEntries] = useState<number | null>(null);
  const [match, setMatch] = useState<MatchPrefs | null>(null);
  const [league, setLeague] = useState<LeagueSettings | null>(null);
  const [turnier, setTurnier] = useState<TurnierSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || !draft.modeKey || !draft.maxEntries) {
      if (!draft?.name.trim()) router.replace("/");
      else if (!draft.modeKey) router.replace("/setup");
      else router.replace("/setup/size");
      return;
    }
    setName(draft.name.trim());
    setModeKey(draft.modeKey);
    const mode = TOURNAMENT_MODE_OPTIONS.find((o) => o.key === draft.modeKey);
    setModeLabel(mode?.label ?? draft.modeKey);
    setMaxEntries(draft.maxEntries);
    setMatch(draft.match);
    setLeague(draft.league);
    setTurnier(draft.turnier);
  }, [router]);

  async function onCreate() {
    const draft = loadSetupDraft();
    if (!draft?.name.trim() || !draft.modeKey || !draft.maxEntries) {
      setError("Setup unvollständig — bitte von vorn beginnen.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createTournament({
        name: draft.name.trim(),
        modeKey: draft.modeKey,
        maxEntries: draft.maxEntries,
        config: buildEventConfigPayload(
          draft.modeKey,
          draft.match,
          draft.league,
          draft.turnier,
        ),
      });
      saveHostSession({
        tournamentId: res.tournament.id,
        inviteCode: res.tournament.inviteCode,
        hostToken: res.hostToken,
      });
      clearSetupDraft();
      router.push(`/host?code=${encodeURIComponent(res.tournament.inviteCode)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Anlegen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (!name || maxEntries == null || !modeKey || !match || !league || !turnier) {
    return (
      <main className="t-shell">
        <p className="t-meta">Lade…</p>
      </main>
    );
  }

  return (
    <main className="t-shell">
      <p className="t-meta">{APP_NAME} · Übersicht</p>
      <h1 className="t-brand" style={{ fontSize: "1.55rem" }}>
        Kurzcheck
      </h1>
      <p className="t-meta">
        Mit „Anlegen“ wird das Ereignis auf dem Server erstellt und die Lobby mit
        QR geöffnet. Anmeldungen schließen erst im Warteraum.
      </p>

      <section className="t-card" aria-label="Zusammenfassung">
        <ul className="t-list">
          <li>
            <span>Name</span>
            <span>{name}</span>
          </li>
          <li>
            <span>Format</span>
            <span>{modeLabel}</span>
          </li>
          <li>
            <span>Max. Spieler</span>
            <span>{maxEntries}</span>
          </li>
          {modeKey === "league" ? (
            <li>
              <span>Runden</span>
              <span>{league.rounds}</span>
            </li>
          ) : (
            <>
              <li>
                <span>Gruppengröße</span>
                <span>{turnier.groupSize}</span>
              </li>
              <li>
                <span>Quali</span>
                <span>Top {turnier.qualifyPerGroup}</span>
              </li>
              <li>
                <span>K.O.</span>
                <span>Einfach</span>
              </li>
            </>
          )}
          <li>
            <span>Partie</span>
            <span>
              {matchModeLabel(match.useStrategyRules)} · {match.gameCount}{" "}
              {match.gameCount === 1 ? "Spiel" : "Spiele"}
            </span>
          </li>
          {match.useStrategyRules && (
            <li>
              <span>Pool</span>
              <span>
                {match.showOpponentPool ? "Gegner sichtbar" : "Gegner aus"}
                {" · "}
                {match.poolEndgameEnabled ? "Endspiel an" : "Endspiel aus"}
              </span>
            </li>
          )}
          {modeKey === "turnier" && (
            <p className="t-setting-hint" style={{ margin: "0.65rem 0 0" }}>
              {formatGroupPreview(maxEntries, turnier.groupSize)}
            </p>
          )}
        </ul>
      </section>

      <div className="t-row" style={{ marginTop: "1rem" }}>
        <Link
          href={modeKey === "turnier" ? "/setup/turnier" : "/setup/league"}
          className="t-btn t-btn--ghost"
        >
          Zurück
        </Link>
        <button
          type="button"
          className="t-btn"
          disabled={busy}
          onClick={() => void onCreate()}
        >
          {busy ? "Wird angelegt…" : "Anlegen"}
        </button>
      </div>

      {error && (
        <p className="t-error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
