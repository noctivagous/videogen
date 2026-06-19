'use client';

import { ALLOW_SERVER_PROJECT_STORAGE } from '@/lib/constants/app-flags';
import {
  collectProjectMediaUploads,
  type ProjectMediaUpload,
} from '@/lib/storage/project-media-paths';
import { blobToDataUrl } from '@/lib/storage/project-assets';
import type { StudioProject } from '@/lib/types/studio';

const SESSION_KEY = 'videogen_server_project_session';

export function isServerProjectStorageEnabled(): boolean {
  return ALLOW_SERVER_PROJECT_STORAGE;
}

export function getServerProjectSessionId(): string {
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

async function prepareUploads(project: StudioProject): Promise<ProjectMediaUpload[]> {
  const raw = collectProjectMediaUploads(project);
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

export async function saveProjectToServer(project: StudioProject): Promise<StudioProject | null> {
  if (!isServerProjectStorageEnabled()) return null;

  const sessionId = getServerProjectSessionId();
  const uploads = await prepareUploads(project);

  const res = await fetch('/api/project-storage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VideoGen-Session': sessionId,
    },
    body: JSON.stringify({ project, uploads }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { project?: StudioProject };
  return data.project ?? null;
}

export async function loadProjectFromServer(): Promise<StudioProject | null> {
  if (!isServerProjectStorageEnabled()) return null;

  const sessionId = getServerProjectSessionId();
  const res = await fetch('/api/project-storage', {
    headers: { 'X-VideoGen-Session': sessionId },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { project?: StudioProject | null };
  return data.project ?? null;
}

export async function clearServerProjectStorage(): Promise<void> {
  if (!isServerProjectStorageEnabled()) return;

  const sessionId = getServerProjectSessionId();
  await fetch('/api/project-storage', {
    method: 'DELETE',
    headers: { 'X-VideoGen-Session': sessionId },
  });
}

