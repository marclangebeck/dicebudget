/**
 * Lokale Rivalen-Avatare (nur Gerät). Blobs in IndexedDB — nie Server/API.
 */

const DB_NAME = "dicebudget.rivalAvatars.v1";
const STORE_NAME = "avatars";
const DB_VERSION = 1;

/** Max. Kantenlänge nach Kompression (px). */
export const RIVAL_AVATAR_MAX_SIDE = 256;

/** Ziel-Qualität JPEG. */
export const RIVAL_AVATAR_JPEG_QUALITY = 0.82;

export const RIVAL_AVATARS_CHANGED_EVENT = "dicebudget:rival-avatars-changed";

export function rivalAvatarTargetSize(
  width: number,
  height: number,
  maxSide = RIVAL_AVATAR_MAX_SIDE,
): { width: number; height: number } {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const longest = Math.max(w, h);
  if (longest <= maxSide) return { width: w, height: h };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

function notifyAvatarsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RIVAL_AVATARS_CHANGED_EVENT));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB nicht verfügbar"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function hasRivalAvatar(rivalId: string): Promise<boolean> {
  const blob = await getRivalAvatarBlob(rivalId);
  return blob != null;
}

export async function getRivalAvatarBlob(rivalId: string): Promise<Blob | null> {
  if (!rivalId || typeof window === "undefined") return null;
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const value = await idbReq(store.get(rivalId));
      if (value instanceof Blob) return value;
      return null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function setRivalAvatarBlob(rivalId: string, blob: Blob): Promise<void> {
  if (!rivalId || !(blob instanceof Blob)) return;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    await idbReq(store.put(blob, rivalId));
  } finally {
    db.close();
  }
  notifyAvatarsChanged();
}

export async function deleteRivalAvatar(rivalId: string): Promise<void> {
  if (!rivalId || typeof window === "undefined") return;
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      await idbReq(store.delete(rivalId));
    } finally {
      db.close();
    }
    notifyAvatarsChanged();
  } catch {
    /* ignore */
  }
}

/** Komprimiert ein File/Blob zu JPEG ≤ maxSide. */
export async function compressRivalAvatarFile(
  file: Blob,
  maxSide = RIVAL_AVATAR_MAX_SIDE,
): Promise<Blob> {
  if (typeof createImageBitmap !== "function") {
    throw new Error("Bildverarbeitung nicht verfügbar");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = rivalAvatarTargetSize(bitmap.width, bitmap.height, maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas nicht verfügbar");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", RIVAL_AVATAR_JPEG_QUALITY);
    });
    if (!blob) throw new Error("Kompression fehlgeschlagen");
    return blob;
  } finally {
    bitmap.close();
  }
}

export function subscribeRivalAvatars(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(RIVAL_AVATARS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(RIVAL_AVATARS_CHANGED_EVENT, listener);
}
