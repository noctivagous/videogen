import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  buildModels,
  lumaResolution,
  mapHttpError,
  MAX_POLLS,
  NO_MODEL_SELECTED_ERROR,
  POLL_INTERVAL_MS,
  requireModelId,
  sleep,
  timedFetch,
} from '@/lib/studio/generation/adapters/shared';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { unionModalities } from '@/lib/studio/provider-modalities';

const LUMA_API = 'https://api.lumalabs.ai/dream-machine/v1';

const LUMA_MODELS = buildModels([
  { id: 'ray-2', name: 'Ray 2', purposes: ['Text-to-Video', 'Image-to-Video'] },
  { id: 'ray-flash-2', name: 'Ray 2 Flash', purposes: ['Text-to-Video'] },
]);

function lumaHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    accept: 'application/json',
  };
}

export async function generateWithLuma(req: GenerationRequest): Promise<GenerationResult> {
  try {
    const model = requireModelId(req.modelId);
    if (!model) {
      return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
    }

    const image = pickImageInput(req.refs);
    const body: Record<string, unknown> = {
      prompt: req.prompt,
      model,
      aspect_ratio: req.aspectRatio,
      resolution: lumaResolution(req.resolution),
      duration: `${Math.min(Math.max(req.duration, 5), 10)}s`,
    };

    if (image) {
      body.keyframes = {
        frame0: { type: 'image', url: resolveRefUrl(image) },
      };
    }

    const createRes = await fetch(`${LUMA_API}/generations`, {
      method: 'POST',
      headers: lumaHeaders(req.apiKey),
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => createRes.statusText);
      return { status: 'error', error: mapHttpError(createRes.status, text || 'Luma generation failed') };
    }

    const created = (await createRes.json()) as { id: string };
    let polls = 0;
    let state = 'queued';

    while (!['completed', 'failed'].includes(state) && polls < MAX_POLLS) {
      await sleep(POLL_INTERVAL_MS);
      const statusRes = await fetch(`${LUMA_API}/generations/${created.id}`, {
        headers: lumaHeaders(req.apiKey),
      });
      if (!statusRes.ok) {
        const text = await statusRes.text().catch(() => statusRes.statusText);
        return { status: 'error', error: mapHttpError(statusRes.status, text), providerJobId: created.id };
      }
      const status = (await statusRes.json()) as {
        id: string;
        state: string;
        failure_reason?: string;
        assets?: { video?: string };
      };
      state = status.state;
      if (state === 'failed') {
        return { status: 'error', error: status.failure_reason || 'Luma generation failed', providerJobId: created.id };
      }
      if (state === 'completed' && status.assets?.video) {
        return {
          status: 'complete',
          videoUrl: status.assets.video,
          posterUrl: image ? resolveRefUrl(image) : undefined,
          providerJobId: created.id,
        };
      }
      polls++;
    }

    return { status: 'error', error: 'Luma generation timed out', providerJobId: created.id };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Luma generation failed' };
  }
}

export async function testLuma(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${LUMA_API}/generations`, {
      method: 'GET',
      headers: lumaHeaders(apiKey),
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: mapHttpError(res.status, 'Invalid Luma API key'), latencyMs };
    }

    if (!res.ok && res.status !== 405 && res.status !== 404) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'Luma connection failed'), latencyMs };
    }

    const modalities = unionModalities(LUMA_MODELS);
    return {
      ok: true,
      message: `Luma API key verified — ${LUMA_MODELS.length} models available`,
      models: LUMA_MODELS,
      modalities,
      purposes: ['Text-to-Video', 'Image-to-Video'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Luma' };
  }
}