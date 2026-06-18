import { mapHttpError, timedFetch } from '@/lib/studio/generation/adapters/shared';
import type { ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';

const HF_VIDEO_MODELS: ProviderModel[] = [
  { id: 'stabilityai/stable-video-diffusion', name: 'Stable Video Diffusion', modalities: ['video'] },
  { id: 'cerspense/zeroscope_v2_XL', name: 'Zeroscope v2 XL', modalities: ['video'] },
  { id: 'tencent/HunyuanVideo', name: 'HunyuanVideo', modalities: ['video'] },
];

export async function testHuggingFace(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch('https://huggingface.co/api/whoami-v2', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'Hugging Face connection failed'), latencyMs };
    }

    const whoami = (await res.json()) as { name?: string };
    const models = HF_VIDEO_MODELS.map((m) => ({
      ...m,
      modalities: inferModalitiesFromModelId(m.id).length > 0 ? inferModalitiesFromModelId(m.id) : m.modalities,
    }));

    return {
      ok: true,
      message: `Hugging Face token verified for ${whoami.name ?? 'your account'} — ${models.length} video models cataloged`,
      models,
      modalities: unionModalities(models),
      purposes: ['Inference Endpoints', 'Open Models'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Hugging Face' };
  }
}