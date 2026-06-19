import {
  blobToDataUrl,
  getAssetBlobUrl,
  isProjectAssetPath,
} from '@/lib/storage/project-assets';

export function resolveReferenceDisplayUrl(ref: string | null): string | null {
  if (!ref) return null;
  if (typeof window === 'undefined') return ref;
  if (isProjectAssetPath(ref)) {
    return getAssetBlobUrl(ref) ?? ref;
  }
  return ref;
}

export async function resolveReferenceForApi(url: string): Promise<string> {
  if (!url) return url;
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/api/project-storage/media/')) {
    try {
      const blob = await fetch(url).then((res) => res.blob());
      return blobToDataUrl(blob);
    } catch {
      return url;
    }
  }
  if (url.startsWith('/')) return url;

  if (url.startsWith('blob:') || isProjectAssetPath(url)) {
    const fetchUrl = isProjectAssetPath(url) ? getAssetBlobUrl(url) : url;
    if (!fetchUrl) return url;
    try {
      const blob = await fetch(fetchUrl).then((res) => res.blob());
      return blobToDataUrl(blob);
    } catch {
      return url;
    }
  }

  return url;
}

export async function resolveRefsForApi<T extends { url: string }>(refs: T[]): Promise<T[]> {
  return Promise.all(
    refs.map(async (ref) => ({
      ...ref,
      url: await resolveReferenceForApi(ref.url),
    })),
  );
}