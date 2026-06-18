import {
  formatApiError,
  mapHttpError,
  MAX_POLLS,
  parseResolution,
  POLL_INTERVAL_MS,
  sleep,
  timedFetch,
} from '@/lib/studio/generation/adapters/shared';

export const FAL_QUEUE_API = 'https://queue.fal.run';
export const FAL_PLATFORM_API = 'https://api.fal.ai/v1';

export interface FalModelEntry {
  endpoint_id: string;
  metadata?: {
    display_name?: string;
    category?: string;
    description?: string;
  };
}

export function falHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Key ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function falVideoResolution(resolution: string): '720p' | '1080p' {
  const { height } = parseResolution(resolution);
  return height >= 1080 ? '1080p' : '720p';
}

export function falVideoDuration(seconds: number): 5 | 10 {
  return seconds >= 8 ? 10 : 5;
}

export async function searchFalModels(
  apiKey: string,
  params: Record<string, string>,
): Promise<FalModelEntry[]> {
  const query = new URLSearchParams({ status: 'active', limit: '50', ...params });
  const { res } = await timedFetch(`${FAL_PLATFORM_API}/models?${query}`, {
    headers: falHeaders(apiKey),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(formatApiError(res.status, text, 'fal model search failed'));
  }

  const data = (await res.json()) as { models?: FalModelEntry[] };
  return data.models ?? [];
}

export async function submitFalQueue(
  endpointId: string,
  apiKey: string,
  input: Record<string, unknown>,
): Promise<{ requestId: string }> {
  const res = await fetch(`${FAL_QUEUE_API}/${endpointId}`, {
    method: 'POST',
    headers: falHeaders(apiKey),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(formatApiError(res.status, text, 'fal queue submit failed'));
  }

  const data = (await res.json()) as { request_id?: string };
  if (!data.request_id) {
    throw new Error('fal did not return a request_id');
  }
  return { requestId: data.request_id };
}

export async function pollFalQueueResult(
  endpointId: string,
  apiKey: string,
  requestId: string,
): Promise<{ videoUrl?: string; error?: string }> {
  for (let poll = 0; poll < MAX_POLLS; poll++) {
    await sleep(POLL_INTERVAL_MS);

    const statusRes = await fetch(
      `${FAL_QUEUE_API}/${endpointId}/requests/${requestId}/status`,
      { headers: falHeaders(apiKey) },
    );

    if (!statusRes.ok) {
      const text = await statusRes.text().catch(() => statusRes.statusText);
      return { error: mapHttpError(statusRes.status, text) };
    }

    const status = (await statusRes.json()) as {
      status?: string;
      error?: string;
    };

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `${FAL_QUEUE_API}/${endpointId}/requests/${requestId}`,
        { headers: falHeaders(apiKey) },
      );

      if (!resultRes.ok) {
        const text = await resultRes.text().catch(() => resultRes.statusText);
        return { error: mapHttpError(resultRes.status, text) };
      }

      const result = (await resultRes.json()) as {
        video?: { url?: string };
        error?: string;
      };

      const videoUrl = result.video?.url;
      if (!videoUrl) {
        return { error: result.error || 'fal returned no video URL' };
      }
      return { videoUrl };
    }

    if (status.error) {
      return { error: status.error };
    }
  }

  return { error: 'fal generation timed out' };
}