'use client';

import {
  ALLOW_SERVER_PROJECT_STORAGE,
  SERVER_PROJECT_STORAGE_DEV_DOWNLOAD_MEDIA_URLS,
  SERVER_PROJECT_STORAGE_DEV_MODE,
  SERVER_PROJECT_STORAGE_DEV_SESSION,
} from '@/lib/constants/app-flags';
import {
  collectProjectMediaUploads,
  filterProjectMediaUploads,
  type ProjectMediaUpload,
} from '@/lib/storage/project-media-paths';
import { blobToDataUrl } from '@/lib/storage/project-assets';
import type { MediaAsset } from '@/lib/types/media-library';
import type { StudioProject } from '@/lib/types/studio';

const SESSION_KEY = 'videogen_server_project_session';

export function isServerProjectStorageEnabled(): boolean {
  return ALLOW_SERVER_PROJECT_STORAGE;
}

export function isServerProjectStorageDevMode(): boolean {
  return isServerProjectStorageEnabled() && SERVER_PROJECT_STORAGE_DEV_MODE;
}

export function shouldIngestRemoteMediaUrls(): boolean {
  if (!isServerProjectStorageDevMode()) return true;
  return SERVER_PROJECT_STORAGE_DEV_DOWNLOAD_MEDIA_URLS;
}

export function getServerProjectSessionId(): string {
  if (isServerProjectStorageDevMode()) {
    return SERVER_PROJECT_STORAGE_DEV_SESSION;
  }

  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function inlineDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  if (url.startsWith('blob:')) return blobToDataUrl(await fetch(url).then((r) => r.blob()));
  return url;
}

async function prepareUploads(
  project: StudioProject,
  globalMediaLibrary: MediaAsset[] = [],
): Promise<ProjectMediaUpload[]> {
  const raw = filterProjectMediaUploads(
    collectProjectMediaUploads(project, globalMediaLibrary),
    {
      ingestRemoteUrls: shouldIngestRemoteMediaUrls(),
    },
  );
  const uploads: ProjectMediaUpload[] = [];

  for (const item of raw) {
    if (item.kind === 'inline') {
      uploads.push({
        path: item.path,
        kind: 'inline',
        dataUrl: await inlineDataUrl(item.dataUrl),
      });
    } else {
      uploads.push(item);
    }
  }

  return uploads;
}

export async function saveProjectToServer(
  project: StudioProject,
  globalMediaLibrary: MediaAsset[] = [],
): Promise<{ project: StudioProject; globalMediaLibrary: MediaAsset[] } | null> {
  if (!isServerProjectStorageEnabled()) return null;

  const sessionId = getServerProjectSessionId();
  const uploads = await prepareUploads(project, globalMediaLibrary);

  const res = await fetch('/api/project-storage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VideoGen-Session': sessionId,
    },
    body: JSON.stringify({ project, uploads, globalMediaLibrary }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    project?: StudioProject;
    globalMediaLibrary?: MediaAsset[];
  };
  if (!data.project) return null;
  return {
    project: data.project,
    globalMediaLibrary: data.globalMediaLibrary ?? globalMediaLibrary,
  };
}

export async function loadProjectFromServer(): Promise<{
  project: StudioProject;
  globalMediaLibrary: MediaAsset[];
} | null> {
  if (!isServerProjectStorageEnabled()) return null;

  const sessionId = getServerProjectSessionId();
  const res = await fetch('/api/project-storage', {
    headers: { 'X-VideoGen-Session': sessionId },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    project?: StudioProject | null;
    globalMediaLibrary?: MediaAsset[];
  };
  if (!data.project) return null;
  return {
    project: data.project,
    globalMediaLibrary: data.globalMediaLibrary ?? [],
  };
}

export async function clearServerProjectStorage(): Promise<void> {
  if (!isServerProjectStorageEnabled()) return;

  const sessionId = getServerProjectSessionId();
  await fetch('/api/project-storage', {
    method: 'DELETE',
    headers: { 'X-VideoGen-Session': sessionId },
  });
}