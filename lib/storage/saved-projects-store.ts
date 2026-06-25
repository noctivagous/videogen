import type { MediaAsset } from '@/lib/types/media-library';
import type { StudioProject } from '@/lib/types/studio';
import type { StoredProjectLocation } from '@/lib/storage/project-handle-store';

const DB_NAME = 'videogen-storage';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const LIST_KEY = 'saved-projects-list';
const ACTIVE_KEY = 'active-project-id';

/** Stable id for the built-in Demo_Surfer starter project — always listed in the switcher. */
export const BUILTIN_DEMO_PROJECT_ID = 'builtin-demo-surfer';

export interface SavedProjectRecord {
  id: string;
  name: string;
  updatedAt: number;
  location?: StoredProjectLocation;
  snapshot?: {
    project: StudioProject;
    globalMediaLibrary: MediaAsset[];
  };
}

export interface SavedProjectSummary {
  id: string;
  name: string;
  locationLabel?: string;
  isActive: boolean;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

async function readStoreValue<T>(key: string): Promise<T | null> {
  const db = await openDb();
  const result = await new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
  });
  db.close();
  return result;
}

async function writeStoreValue(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
  });
  db.close();
}

export async function listSavedProjects(): Promise<SavedProjectRecord[]> {
  if (typeof window === 'undefined') return [];
  const records = await readStoreValue<SavedProjectRecord[]>(LIST_KEY);
  if (!Array.isArray(records)) return [];
  return records.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getSavedProject(id: string): Promise<SavedProjectRecord | null> {
  const records = await listSavedProjects();
  return records.find((record) => record.id === id) ?? null;
}

export async function upsertSavedProject(record: SavedProjectRecord): Promise<void> {
  const records = await listSavedProjects();
  const next = records.filter((entry) => entry.id !== record.id);
  next.push({ ...record, updatedAt: Date.now() });
  next.sort((a, b) => b.updatedAt - a.updatedAt);
  await writeStoreValue(LIST_KEY, next);
}

export async function getActiveProjectId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return readStoreValue<string>(ACTIVE_KEY);
}

export async function setActiveProjectId(id: string): Promise<void> {
  await writeStoreValue(ACTIVE_KEY, id);
}

export function toSavedProjectSummaries(
  records: SavedProjectRecord[],
  activeProjectId: string | null,
): SavedProjectSummary[] {
  return records.map((record) => ({
    id: record.id,
    name: record.name,
    locationLabel: record.location?.name,
    isActive: record.id === activeProjectId,
  }));
}
