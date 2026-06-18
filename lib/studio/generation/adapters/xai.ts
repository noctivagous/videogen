import { mapHttpError, timedFetch } from '@/lib/studio/generation/adapters/shared';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';

const XAI_API = 'https://api.x.ai/v1';

export async function generateWithXAI(req: GenerationRequest): Promise<GenerationResult> {
  try {
    const model = req.modelId || 'grok-video';
    const res = await fetch(`${XAI_API}/videos/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: req.prompt,
        aspect_ratio: req.aspectRatio,
        duration: req.duration,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { status: 'error', error: mapHttpError(res.status, text || 'xAI video generation failed') };
    }

    const result = (await res.json()) as { id?: string; video_url?: string; url?: string };
    const videoUrl = result.video_url || result.url;
    if (!videoUrl) {
      return { status: 'error', error: 'xAI returned no video URL', providerJobId: result.id };
    }

    return { status: 'complete', videoUrl, providerJobId: result.id };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'xAI generation failed' };
  }
}

export async function testXAI(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${XAI_API}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'xAI connection failed'), latencyMs };
    }

    const data = (await res.json()) as { data?: Array<{ id: string }> };
    const raw = data.data ?? [];
    const models: ProviderModel[] = raw.map((m) => ({
      id: m.id,
      name: m.id,
      modalities: inferModalitiesFromModelId(m.id),
    }));

    const videoModels = models.filter((m) => m.modalities.includes('video'));
    const displayModels = videoModels.length > 0 ? videoModels : models;

    return {
      ok: true,
      message: `xAI key verified — ${displayModels.length} model${displayModels.length === 1 ? '' : 's'} found`,
      models: displayModels,
      modalities: unionModalities(displayModels),
      purposes: ['Text-to-Video', 'Reasoning Video'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach xAI' };
  }
}