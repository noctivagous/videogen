import { isArchivableRemoteMediaUrl } from '@/lib/media/remote-media.shared';

function blobFromInlineDataUrl(dataUrl: string): Blob | null {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,([\s\S]*)$/);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const payload = match[2];
  if (dataUrl.includes(';base64')) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(payload)], { type: mime });
}

/** Download provider media — tries browser fetch first, then server archive API. */
export async function fetchRemoteMediaBlob(url: string): Promise<Blob | null> {
  if (url.startsWith('data:')) {
    return blobFromInlineDataUrl(url);
  }
  if (url.startsWith('blob:')) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.blob();
    } catch {
      return null;
    }
  }

  if (!isArchivableRemoteMediaUrl(url)) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.blob();
    } catch {
      return null;
    }
  }

  try {
    const res = await fetch(url);
    if (res.ok) return res.blob();
  } catch {
    // Browser fetch often fails on provider CDNs (CORS).
  }

  try {
    const res = await fetch('/api/archive-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { dataUrl?: string };
    if (!data.dataUrl) return null;
    return blobFromInlineDataUrl(data.dataUrl);
  } catch {
    return null;
  }
}

export async function fetchRemoteMediaAsDataUrl(url: string): Promise<string | null> {
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('/api/') ||
    url.startsWith('/stock/') ||
    url.startsWith('assets/')
  ) {
    return url;
  }

  const blob = await fetchRemoteMediaBlob(url);
  if (!blob) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read media blob'));
    reader.readAsDataURL(blob);
  });
}
