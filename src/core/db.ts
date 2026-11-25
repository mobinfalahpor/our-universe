import { openDB, type IDBPDatabase } from 'idb';
import type { UniversePersistedState } from './types';

const DB_NAME = 'our-little-universe-db';
const DB_VERSION = 1;
const STORE_NAME = 'universe_state';
const STATE_KEY = 'main_v1';

let dbPromise: Promise<IDBPDatabase> | null = null;
const memoryFallback = new Map<string, UniversePersistedState>();

function getDb() {
  if (!dbPromise && typeof indexedDB !== 'undefined') {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function loadUniverseState(): Promise<UniversePersistedState | null> {
  try {
    const db = await getDb();
    if (!db) return memoryFallback.get(STATE_KEY) ?? null;
    const data = await db.get(STORE_NAME, STATE_KEY);
    return (data as UniversePersistedState | undefined) ?? null;
  } catch {
    return memoryFallback.get(STATE_KEY) ?? null;
  }
}

export async function saveUniverseState(state: UniversePersistedState): Promise<void> {
  memoryFallback.set(STATE_KEY, state);
  try {
    const db = await getDb();
    if (!db) return;
    await db.put(STORE_NAME, state, STATE_KEY);
  } catch {
    // Fallback already updated in memory
  }
}

export async function clearUniverseState(): Promise<void> {
  memoryFallback.clear();
  try {
    const db = await getDb();
    if (!db) return;
    await db.delete(STORE_NAME, STATE_KEY);
  } catch {
    // Ignore
  }
}
