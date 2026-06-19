'use client';

import { useLayoutEffect, useState } from 'react';
import {
  getFileSystemAccessStatus,
  type FileSystemAccessStatus,
} from '@/lib/storage/file-project';

const SERVER_STATUS: FileSystemAccessStatus = { tier: 'none', supported: false, reason: 'ssr' };

/** Client-only File System Access API detection — avoids SSR/hydration false negatives. */
export function useFileSystemAccess(): FileSystemAccessStatus {
  const [status, setStatus] = useState<FileSystemAccessStatus>(SERVER_STATUS);

  useLayoutEffect(() => {
    const refresh = () => setStatus(getFileSystemAccessStatus());
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return status;
}