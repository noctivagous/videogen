import {
  mapHttpError,
  NO_MODEL_SELECTED_ERROR,
  requireModelId,
  timedFetch,
  unionFromModels,
} from '@/lib/studio/generation/adapters/shared';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';

const OPENAI_API = 'https://api.openai.com/v1';

export async function generateWithOpenAI(req: GenerationRequest): Promise<GenerationResult> {
  try {
    const videoModel = requireModelId(req.modelId);
    if (!videoModel) {
      return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
    }
    if (!videoModel) {
      return {
        status: 'error',
        error: 'No video-capable OpenAI model is available on this API key. Verify Sora access in your OpenAI account.',
      };
    }

    const createRes = await fetch(`${OPENAI_API}/videos/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: videoModel,
        prompt: req.prompt,
        size: req.resolution.replace('x', 'x'),
        seconds: req.duration,
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => createRes.statusText);
      return { status: 'error', error: mapHttpError(createRes.status, text || 'OpenAI video generation failed') };
    }

    const result = (await createRes.json()) as {
      id?: string;
      data?: Array<{ url?: string }>;
      url?: string;
    };
    const videoUrl = result.url || result.data?.[0]?.url;
    if (!videoUrl) {
      return { status: 'error', error: 'OpenAI returned no video URL', providerJobId: result.id };
    }

    return { status: 'complete', videoUrl, providerJobId: result.id };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'OpenAI generation failed' };
  }
}

export async function testOpenAI(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${OPENAI_API}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return {
        ok: false,
        message: mapHttpError(res.status, text || 'OpenAI connection failed'),
        latencyMs,
      };
    }

    const data = (await res.json()) as { data?: Array<{ id: string }> };
    const raw = data.data ?? [];
    const models: ProviderModel[] = raw
      .map((m) => ({
        id: m.id,
        name: m.id,
        modalities: inferModalitiesFromModelId(m.id),
      }))
      .filter((m) => m.modalities.length > 0);

    const modalities = models.length > 0 ? unionModalities(models) : unionFromModels(models);

    return {
      ok: true,
      message: `OpenAI key verified — ${models.length} capable model${models.length === 1 ? '' : 's'} found`,
      models,
      modalities,
      latencyMs,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Could not reach OpenAI',
    };
  }
}