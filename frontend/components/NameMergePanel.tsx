"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlayerNames, mergePlayerNames, removePlayerNameAlias } from "@/lib/api";
import type { PlayerNameAliasDto } from "@/lib/playerNameTypes";

type Props = {
  onChanged?: () => void;
  variant?: "default" | "stats";
};

export function NameMergePanel({ onChanged, variant = "default" }: Props) {
  const [names, setNames] = useState<string[]>([]);
  const [aliases, setAliases] = useState<PlayerNameAliasDto[]>([]);
  const [aliasName, setAliasName] = useState("");
  const [canonicalName, setCanonicalName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlayerNames();
      setNames(data.names);
      setAliases(data.aliases);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Namen nicht geladen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleMerge(e: React.FormEvent) {
    e.preventDefault();
    if (!aliasName || !canonicalName) return;
    setSaving(true);
    setError(null);
    try {
      await mergePlayerNames(aliasName, canonicalName);
      setAliasName("");
      await refresh();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zusammenführen fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(alias: string) {
    setSaving(true);
    setError(null);
    try {
      await removePlayerNameAlias(alias);
      await refresh();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Entfernen fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  const panelClass =
    variant === "stats"
      ? "stats-merge-panel flex flex-col gap-3"
      : "glass-panel flex flex-col gap-3 p-4";

  return (
    <section className={panelClass}>
      <div>
        <h2
          className={
            variant === "stats"
              ? "stats-section-title"
              : "text-secondary text-sm font-semibold"
          }
        >
          Namen zusammenführen
        </h2>
        <p className="text-muted mt-1 text-xs">
          Wenn dieselbe Person mal kürzer, mal länger eingetragen hat (z. B. „Marc“ und „Marc
          Langebeck“), kannst du das hier verbinden.
        </p>
      </div>

      {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

      {loading ? (
        <p className="text-muted text-sm">Lade Namen …</p>
      ) : names.length === 0 ? (
        <p className="text-muted text-sm">Noch keine Spielernamen vorhanden.</p>
      ) : (
        <form onSubmit={(e) => void handleMerge(e)} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-secondary">Alternativer Name</span>
              <select
                value={aliasName}
                onChange={(e) => setAliasName(e.target.value)}
                className="glass-input px-3 py-2"
                required
              >
                <option value="">Auswählen …</option>
                {names.map((name) => (
                  <option key={`alias-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-secondary">Hauptname</span>
              <select
                value={canonicalName}
                onChange={(e) => setCanonicalName(e.target.value)}
                className="glass-input px-3 py-2"
                required
              >
                <option value="">Auswählen …</option>
                {names.map((name) => (
                  <option key={`canonical-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={saving || !aliasName || !canonicalName || aliasName === canonicalName}
            className="home-bento-submit home-bento-submit--lg w-full font-semibold disabled:opacity-50"
          >
            {saving ? "Speichere …" : "Zusammenführen"}
          </button>
        </form>
      )}

      {aliases.length > 0 && (
        <ul className="space-y-2 border-t border-slate-900/10 pt-3">
          {aliases.map((alias) => (
            <li
              key={alias.aliasName}
              className="stats-alias-row flex items-center justify-between gap-3 text-sm"
            >
              <span>
                <span className="text-strong">{alias.aliasName}</span>
                <span className="text-muted"> → {alias.canonicalName}</span>
              </span>
              <button
                type="button"
                onClick={() => void handleRemove(alias.aliasName)}
                disabled={saving}
                className="btn-chip px-2 py-1 text-xs disabled:opacity-50"
              >
                Aufheben
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
