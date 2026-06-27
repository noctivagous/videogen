import { NextResponse } from 'next/server';
import { fetchRemoteMediaBuffer } from '@/lib/media/remote-media.server';
import { isArchivableRemoteMediaUrl } from '@/lib/media/remote-media.shared';

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();
    if (!url || !isArchivableRemoteMediaUrl(url)) {
      return NextResponse.json({ error: 'Invalid or disallowed URL' }, { status: 400 });
    }

    const { bytes, mime } = await fetchRemoteMediaBuffer(url);
    const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`;
    return NextResponse.json({ dataUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Archive failed' },
      { status: 502 },
    );
  }
}
