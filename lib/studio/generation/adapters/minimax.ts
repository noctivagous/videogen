import { buildModels, mapHttpError, timedFetch } from '@/lib/studio/generation/adapters/shared';
import type { ProviderTestResult } from '@/lib/studio/generation/types';
import { unionModalities } from '@/lib/studio/provider-modalities';

const MINIMAX_API = 'https://api.minimax.io/v1';

const MINIMAX_MODELS = buildModels([
  { id: 'hailuo-video', name: 'Hailuo Video', purposes: ['Text-to-Video', 'Image-to-Video'] },
  { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', purposes: ['Reasoning'] },
], ['llm']);

export async function testMinimax(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${MINIMAX_API}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: mapHttpError(res.status, 'Invalid MiniMax API key'), latencyMs };
    }

    if (res.ok) {
      const data = (await res.json()) as { data?: Array<{ id?: string }> } | Array<{ id?: string }>;
      const raw = Array.isArray(data) ? data : data.data ?? [];
      return {
        ok: true,
        message: `MiniMax API key verified — ${raw.length || MINIMAX_MODELS.length} model${raw.length === 1 ? '' : 's'} available`,
        models: MINIMAX_MODELS,
        modalities: unionModalities(MINIMAX_MODELS),
        purposes: ['Text-to-Video', 'Cinematic Motion'],
        latencyMs,
      };
    }

    const videoProbe = await timedFetch(`${MINIMAX_API}/video_generation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (videoProbe.res.status === 401 || videoProbe.res.status === 403) {
      return { ok: false, message: mapHttpError(videoProbe.res.status, 'Invalid MiniMax API key'), latencyMs: videoProbe.latencyMs };
    }

    if (!videoProbe.res.ok && videoProbe.res.status !== 400 && videoProbe.res.status !== 422) {
      const text = await videoProbe.res.text().catch(() => videoProbe.res.statusText);
      return { ok: false, message: mapHttpError(videoProbe.res.status, text || 'MiniMax connection failed'), latencyMs: videoProbe.latencyMs };
    }

    return {
      ok: true,
      message: `MiniMax API key verified — ${MINIMAX_MODELS.length} models cataloged`,
      models: MINIMAX_MODELS,
      modalities: unionModalities(MINIMAX_MODELS),
      purposes: ['Text-to-Video', 'Cinematic Motion'],
      latencyMs: videoProbe.latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach MiniMax' };
  }
}
