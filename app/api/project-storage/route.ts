import { NextResponse } from 'next/server';
import { validateStudioProject } from '@/lib/storage/project-io';
import type { ProjectMediaUpload } from '@/lib/storage/project-media-paths';
import {
  deleteServerProject,
  isServerProjectStorageAllowed,
  isServerProjectSessionAllowed,
  loadServerProject,
  saveServerProject,
} from '@/lib/storage/server-project-store.server';
import type { StudioProject } from '@/lib/types/studio';

export const maxDuration = 300;

function sessionFromRequest(request: Request): string | null {
  const header = request.headers.get('X-VideoGen-Session')?.trim();
  if (!header || header.length > 128) return null;
  return header;
}

function storageDisabled() {
  return NextResponse.json({ error: 'Server project storage is disabled' }, { status: 403 });
}

export async function GET(request: Request) {
  if (!isServerProjectStorageAllowed()) return storageDisabled();

  const sessionId = sessionFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session' }, { status: 400 });
  }
  if (!isServerProjectSessionAllowed(sessionId)) {
    return NextResponse.json({ error: 'Session not allowed' }, { status: 403 });
  }

  const project = await loadServerProject(sessionId);
  return NextResponse.json({ project });
}

export async function POST(request: Request) {
  if (!isServerProjectStorageAllowed()) return storageDisabled();

  const sessionId = sessionFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session' }, { status: 400 });
  }
  if (!isServerProjectSessionAllowed(sessionId)) {
    return NextResponse.json({ error: 'Session not allowed' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      project?: StudioProject;
      uploads?: ProjectMediaUpload[];
    };

    const project = validateStudioProject(body.project);
    if (!project) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 });
    }

    const uploads = Array.isArray(body.uploads) ? body.uploads : [];
    const saved = await saveServerProject(sessionId, project, uploads);
    return NextResponse.json({ ok: true, project: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Save failed' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isServerProjectStorageAllowed()) return storageDisabled();

  const sessionId = sessionFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session' }, { status: 400 });
  }
  if (!isServerProjectSessionAllowed(sessionId)) {
    return NextResponse.json({ error: 'Session not allowed' }, { status: 403 });
  }

  await deleteServerProject(sessionId);
  return NextResponse.json({ ok: true });
}