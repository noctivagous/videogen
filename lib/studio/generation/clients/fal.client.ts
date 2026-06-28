import { createFalClient as createFalSdkClient, type FalClient } from '@fal-ai/client';
import { formatApiError, timedFetch } from '@/lib/studio/generation/adapters/shared';

export const FAL_PLATFORM_API = 'https://api.fal.ai/v1';

export interface FalModelEntry {
  endpoint_id: string;
  metadata?: {
    display_name?: string;
    category?: string;
    description?: string;
  };
}

export function createFalClient(apiKey: string): FalClient {
  return createFalSdkClient({ credentials: apiKey });
}

export async function searchFalPlatformModels(
  apiKey: string,
  params: Record<string, string>,
): Promise<FalModelEntry[]> {
  const query = new URLSearchParams({ status: 'active', limit: '50', ...params });
  const { res } = await timedFetch(`${FAL_PLATFORM_API}/models?${query}`, {
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(formatApiError(res.status, text, 'fal model search failed'));
  }

  const data = (await res.json()) as { models?: FalModelEntry[] };
  return data.models ?? [];
}

export function extractFalVideoUrl(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const record = result as Record<string, unknown>;
  const video = record.video;
  if (video && typeof video === 'object' && 'url' in video) {
    const url = (video as { url?: unknown }).url;
    if (typeof url === 'string' && url.length > 0) return url;
  }
  const videos = record.videos;
  if (Array.isArray(videos) && videos.length > 0) {
    const first = videos[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) {
      const url = (first as { url?: unknown }).url;
      if (typeof url === 'string' && url.length > 0) return url;
    }
  }
  return null;
}

export function extractFalImageUrl(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const record = result as Record<string, unknown>;
  const image = record.image;
  if (image && typeof image === 'object' && 'url' in image) {
    const url = (image as { url?: unknown }).url;
    if (typeof url === 'string' && url.length > 0) return url;
  }
  const images = record.images;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) {
      const url = (first as { url?: unknown }).url;
      if (typeof url === 'string' && url.length > 0) return url;
    }
  }
  return extractFalVideoUrl(result);
}
