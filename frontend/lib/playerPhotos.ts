import { normalizePublicPlayerId } from "@/lib/playerIdentity";
import { findRivalByPlayerId, loadRivalProfiles } from "@/lib/rivalProfiles";
import {
  deleteRivalAvatar,
  getRivalAvatarBlob,
  setRivalAvatarBlob,
} from "@/lib/rivalAvatarStore";

const MIGRATED_KEY = "dicebudget.playerPhotos.migratedFromRivals.v1";

let migratePromise: Promise<void> | null = null;

/** Einmalig: bisherige Rivalen-Profil-Fotos auf verknüpfte playerIds kopieren. */
export function migratePlayerPhotosFromRivals(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.localStorage.getItem(MIGRATED_KEY) === "1") return Promise.resolve();
  if (migratePromise) return migratePromise;
  migratePromise = (async () => {
    try {
      for (const profile of loadRivalProfiles()) {
        const blob = await getRivalAvatarBlob(profile.id);
        if (!blob) continue;
        for (const playerId of profile.playerIds) {
          const id = normalizePublicPlayerId(playerId);
          if (!id) continue;
          const existing = await getRivalAvatarBlob(id);
          if (!existing) await setRivalAvatarBlob(id, blob);
        }
      }
      window.localStorage.setItem(MIGRATED_KEY, "1");
    } catch {
      migratePromise = null;
    }
  })();
  return migratePromise;
}

export async function getPlayerPhotoBlob(playerId: string): Promise<Blob | null> {
  await migratePlayerPhotosFromRivals();
  const id = normalizePublicPlayerId(playerId);
  if (!id) return null;
  const direct = await getRivalAvatarBlob(id);
  if (direct) return direct;
  const profile = findRivalByPlayerId(id);
  if (profile) return getRivalAvatarBlob(profile.id);
  return null;
}

export async function setPlayerPhotoBlob(playerId: string, blob: Blob): Promise<void> {
  await migratePlayerPhotosFromRivals();
  const id = normalizePublicPlayerId(playerId);
  if (!id) return;
  await setRivalAvatarBlob(id, blob);
}

export async function deletePlayerPhoto(playerId: string): Promise<void> {
  const id = normalizePublicPlayerId(playerId);
  if (!id) return;
  await deleteRivalAvatar(id);
  const profile = findRivalByPlayerId(id);
  if (profile) await deleteRivalAvatar(profile.id);
}
