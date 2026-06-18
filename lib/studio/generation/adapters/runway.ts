import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  buildModels,
  mapHttpError,
  MAX_POLLS,
  POLL_INTERVAL_MS,
  sleep,
  timedFetch,
} from '@/lib/studio/generation/adapters/shared';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { unionModalities } from '@/lib/studio/provider-modalities';

const RUNWAY_API = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';
const DEFAULT_MODEL = 'gen3a_turbo';

const RUNWAY_MODELS = buildModels([
  { id: 'gen3a_turbo', name: 'Gen-3 Alpha Turbo', purposes: ['Text-to-Video'] },
  { id: 'gen3a', name: 'Gen-3 Alpha', purposes: ['Text-to-Video'] },
  { id: 'gen4_turbo', name: 'Gen-4 Turbo', purposes: ['Text-to-Video', 'Image-to-Video'] },
]);

function runwayHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'X-Runway-Version': RUNWAY_VERSION,
    'Content-Type': 'application/json',
  };
}

async function runwayFetch(path: string, apiKey: string, init?: RequestInit) {
  const res = await fetch(`${RUNWAY_API}${path}`, {
    ...init,
    headers: { ...runwayHeaders(apiKey), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(mapHttpError(res.status, text || 'Runway API error'));
  }
  return res.json();
}

export async function generateWithRunway(req: GenerationRequest): Promise<GenerationResult> {
  try {
    const image = pickImageInput(req.refs);
    const model = req.modelId || DEFAULT_MODEL;
    const body: Record<string, unknown> = {
      model,
      promptText: req.prompt.slice(0, 512),
      ratio: req.aspectRatio,
      duration: req.duration >= 8 ? 10 : 5,
    };

    const endpoint = image ? '/image_to_video' : '/text_to_video';
    if (image) {
      body.promptImage = resolveRefUrl(image);
    }

    const task = await runwayFetch(endpoint, req.apiKey, {
      method: 'POST',
      body: JSON.stringify(body),
    }) as { id: string };

    let status = await runwayFetch(`/tasks/${task.id}`, req.apiKey) as {
      id: string;
      status: string;
      output?: string[] | { url?: string };
      failure?: string;
      failureCode?: string;
    };

    let polls = 0;
    while (!['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(status.status) && polls < MAX_POLLS) {
      await sleep(POLL_INTERVAL_MS);
      status = await runwayFetch(`/tasks/${task.id}`, req.apiKey);
      polls++;
    }

    if (status.status !== 'SUCCEEDED') {
      return {
        status: 'error',
        error: status.failure || `Runway task ${status.status}`,
        providerJobId: task.id,
      };
    }

    const output = status.output;
    const videoUrl = Array.isArray(output) ? output[0] : (output as { url?: string })?.url;
    if (!videoUrl || typeof videoUrl !== 'string') {
      return { status: 'error', error: 'No video URL in Runway response', providerJobId: task.id };
    }

    return {
      status: 'complete',
      videoUrl,
      posterUrl: image ? resolveRefUrl(image) : undefined,
      providerJobId: task.id,
    };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Runway generation failed' };
  }
}

export async function testRunway(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${RUNWAY_API}/tasks?limit=1`, {
      headers: runwayHeaders(apiKey),
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: mapHttpError(res.status, 'Invalid Runway API key'), latencyMs };
    }

    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'Runway connection failed'), latencyMs };
    }

    const modalities = unionModalities(RUNWAY_MODELS);
    return {
      ok: true,
      message: `Runway API key verified — ${RUNWAY_MODELS.length} models available`,
      models: RUNWAY_MODELS,
      modalities,
      purposes: ['Text-to-Video', 'Image-to-Video', 'Motion Brush'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Runway' };
  }
}