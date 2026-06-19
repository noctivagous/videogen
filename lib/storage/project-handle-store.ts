const DB_NAME = 'videogen-storage';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const LOCATION_KEY = 'project-location';

export type StoredProjectLocationKind = 'directory' | 'file';

export interface StoredProjectLocation {
  kind: StoredProjectLocationKind;
  name: string;
  handle: FileSystemDirectoryHandle | FileSystemFileHandle;
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

export async function saveProjectLocation(location: StoredProjectLocation): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(location, LOCATION_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
  });
  db.close();
}

export async function loadProjectLocation(): Promise<StoredProjectLocation | null> {
  const db = await openDb();
  const result = await new Promise<StoredProjectLocation | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(LOCATION_KEY);
    request.onsuccess = () => resolve((request.result as StoredProjectLocation | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
  });
  db.close();
  return result;
}

export async function clearProjectLocation(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(LOCATION_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
  });
  db.close();
}