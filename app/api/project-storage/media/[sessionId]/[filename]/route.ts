import { NextResponse } from 'next/server';
import {
  isServerProjectStorageAllowed,
  readServerMediaFile,
} from '@/lib/storage/server-project-store.server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string; filename: string }> },
) {
  if (!isServerProjectStorageAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { sessionId, filename } = await context.params;
  const file = await readServerMediaFile(sessionId, filename);
  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}