import type { Client, FollowUp, Property } from "./data";

export type Dataset = {
  properties: Property[];
  clients: Client[];
  followUps: FollowUp[];
};

const DB_NAME = "amlak-local";
const STORE = "kv";
const KEY = "dataset-v1";
const LS_KEY = "amlak-local-dataset-v1";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const hasIdb = () => typeof indexedDB !== "undefined";

export async function loadDataset(): Promise<Dataset | null> {
  if (typeof window === "undefined") return null;
  if (hasIdb()) {
    try {
      const db = await openDb();
      const value = await new Promise<Dataset | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(KEY);
        req.onsuccess = () => resolve(req.result as Dataset | undefined);
        req.onerror = () => reject(req.error);
      });
      db.close();
      if (value) return value;
    } catch {
      /* fall through to localStorage */
    }
  }
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Dataset) : null;
  } catch {
    return null;
  }
}

export async function saveDataset(dataset: Dataset): Promise<void> {
  if (typeof window === "undefined") return;
  if (hasIdb()) {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(dataset, KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
      return;
    } catch {
      /* fall through to localStorage */
    }
  }
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(dataset));
  } catch {
    /* storage full — keep in-memory state */
  }
}

export async function clearDataset(): Promise<void> {
  if (typeof window === "undefined") return;
  if (hasIdb()) {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      /* ignore */
    }
  }
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}
