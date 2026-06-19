'use client';

import { useSyncExternalStore } from 'react';
import {
  getFileSystemAccessStatus,
  type FileSystemAccessStatus,
} from '@/lib/storage/file-project';

const SERVER_STATUS: FileSystemAccessStatus = { supported: false, reason: 'ssr' };

let cachedSnapshot: FileSystemAccessStatus = SERVER_STATUS;
let cachedKey = 'ssr';

function snapshotKey(status: FileSystemAccessStatus): string {
  return `${status.supported}:${status.reason}`;
}

function readSnapshot(): FileSystemAccessStatus {
  if (typeof window === 'undefined') return SERVER_STATUS;
  const next = getFileSystemAccessStatus();
  const key = snapshotKey(next);
  if (key === cachedKey) return cachedSnapshot;
  cachedKey = key;
  cachedSnapshot = next;
  return cachedSnapshot;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('focus', onStoreChange);
  window.addEventListener('visibilitychange', onStoreChange);
  return () => {
    window.removeEventListener('focus', onStoreChange);
    window.removeEventListener('visibilitychange', onStoreChange);
  };
}

function getServerSnapshot(): FileSystemAccessStatus {
  return SERVER_STATUS;
}

/** Live File System Access API detection — avoids stale zustand values after SSR/HMR. */
export function useFileSystemAccess(): FileSystemAccessStatus {
  return useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);
}