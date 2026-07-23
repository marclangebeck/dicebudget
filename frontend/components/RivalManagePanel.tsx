"use client";

import { useEffect, useState } from "react";
import {
  createRival,
  deleteRival,
  loadRivalProfiles,
  mergeRivals,
  renameRival,
  rivalLinkedIdsLabel,
  subscribeRivalProfiles,
  type RivalProfile,
} from "@/lib/rivalProfiles";

export function RivalManagePanel() {
  const [profiles, setProfiles] = useState<RivalProfile[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [mergeSourceId, setMergeSourceId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setProfiles(loadRivalProfiles());
  }

  useEffect(() => {
    refresh();
    return subscribeRivalProfiles(refresh);
  }, []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const created = createRival(newName);
    if (!created) {
      setError("Bitte einen Namen eingeben.");
      return;
    }
    setNewName("");
    refresh();
  }

  function startEdit(profile: RivalProfile) {
    setEditingId(profile.id);
    setEditName(profile.name);
    setError(null);
  }

  function saveEdit() {
    if (!editingId) return;
    setError(null);
    if (!editName.trim()) {
      setError("Name darf nicht leer sein.");
      return;
    }
    renameRival(editingId, editName);
    setEditingId(null);
    setEditName("");
    refresh();
  }

  function handleDelete(profile: RivalProfile) {
    const ok = window.confirm(
      `Rival „${profile.name}“ wirklich löschen?\n\nNur der lokale Name wird entfernt — Spielstände bleiben.`,
    );
    if (!ok) return;
    deleteRival(profile.id);
    if (mergeSourceId === profile.id) setMergeSourceId("");
    if (editingId === profile.id) setEditingId(null);
    refresh();
  }

  function handleMerge(targetId: string) {
    if (!mergeSourceId || mergeSourceId === targetId) {
      setError("Zum Zusammenführen zuerst bei einem Rivalen „Zusammenführen“ tippen.");
      return;
    }
    const source = profiles.find((profile) => profile.id === mergeSourceId);
    const target = profiles.find((profile) => profile.id === targetId);
    if (!source || !target) return;
    const ok = window.confirm(
      `„${source.name}“ mit „${target.name}“ zusammenführen?\n\nEs bleibt nur „${target.name}“. Alle Spiele von „${source.name}“ zählen dann dazu. „${source.name}“ verschwindet aus der Liste.`,
    );
    if (!ok) return;
    mergeRivals(targetId, mergeSourceId);
    setMergeSourceId("");
    setError(null);
    refresh();
  }

  return (
    <div className="rival-manage">
      <p className="rival-manage-hint">
        Namen gelten nur auf diesem Gerät. Doppelte Einträge derselben Person: bei einem
        „Zusammenführen“ tippen, beim anderen „Hier zusammenführen“. Manuell angelegte Rivalen
        verknüpfst du in der Statistik: Unbekannten Gegner antippen → Rivalen wählen.
      </p>

      <form onSubmit={handleCreate} className="rival-manage-create">
        <input
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setError(null);
          }}
          maxLength={40}
          placeholder="Neuer Rival (Name)"
          className="glass-input rival-manage-input"
          aria-label="Name für neuen Rivalen"
        />
        <button type="submit" className="rival-manage-btn rival-manage-btn--primary">
          Anlegen
        </button>
      </form>

      {error && <p className="rival-manage-error">{error}</p>}

      {profiles.length === 0 ? (
        <p className="rival-manage-empty">Noch keine Rivalen. Lege einen Namen an oder benenne
          Gegner in der Statistik.</p>
      ) : (
        <ul className="rival-manage-list">
          {profiles.map((profile) => (
            <li key={profile.id} className="rival-manage-item">
              {editingId === profile.id ? (
                <div className="rival-manage-edit">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={40}
                    className="glass-input rival-manage-input"
                    aria-label={`Name für ${profile.name}`}
                  />
                  <button
                    type="button"
                    className="rival-manage-btn rival-manage-btn--primary"
                    onClick={saveEdit}
                  >
                    Speichern
                  </button>
                  <button
                    type="button"
                    className="rival-manage-btn"
                    onClick={() => setEditingId(null)}
                  >
                    Abbruch
                  </button>
                </div>
              ) : (
                <>
                  <div className="rival-manage-item-main">
                    <p className="rival-manage-name">{profile.name}</p>
                    <p className="rival-manage-meta">{rivalLinkedIdsLabel(profile)}</p>
                  </div>
                  <div className="rival-manage-item-actions">
                    <button
                      type="button"
                      className="rival-manage-btn"
                      onClick={() => startEdit(profile)}
                    >
                      Umbenennen
                    </button>
                    <button
                      type="button"
                      className="rival-manage-btn"
                      onClick={() => handleDelete(profile)}
                    >
                      Löschen
                    </button>
                    {profiles.length > 1 && (
                      <>
                        <button
                          type="button"
                          className={`rival-manage-btn${mergeSourceId === profile.id ? " is-active" : ""}`}
                          aria-pressed={mergeSourceId === profile.id}
                          onClick={() =>
                            setMergeSourceId((current) =>
                              current === profile.id ? "" : profile.id,
                            )
                          }
                        >
                          {mergeSourceId === profile.id ? "Gewählt ✓" : "Zusammenführen"}
                        </button>
                        {mergeSourceId && mergeSourceId !== profile.id && (
                          <button
                            type="button"
                            className="rival-manage-btn rival-manage-btn--primary"
                            onClick={() => handleMerge(profile.id)}
                          >
                            Hier zusammenführen
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
