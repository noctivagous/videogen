import { isArchivableRemoteMediaUrl } from '@/lib/media/remote-media.shared';

const MAX_ARCHIVE_BYTES = 200 * 1024 * 1024;

export async function fetchRemoteMediaBuffer(
  url: string,
): Promise<{ bytes: Buffer; mime: string }> {
  if (!isArchivableRemoteMediaUrl(url)) {
    throw new Error('URL is not allowed for remote media archive');
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    throw new Error(`Failed to fetch media (${res.status})`);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_ARCHIVE_BYTES) {
    throw new Error('Remote media exceeds archive size limit');
  }

  const headerMime = res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  const mime = headerMime || guessMimeFromUrl(url) || 'application/octet-stream';
  return { bytes, mime };
}

function guessMimeFromUrl(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes('.mp4')) return 'video/mp4';
  if (lower.includes('.webm')) return 'video/webm';
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  if (lower.includes('.webp')) return 'image/webp';
  return null;
}
