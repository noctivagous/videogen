import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import { buildModels, mapHttpError, timedFetch } from '@/lib/studio/generation/adapters/shared';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { unionModalities } from '@/lib/studio/provider-modalities';

const STABILITY_MODELS = buildModels([
  { id: 'stable-video-diffusion', name: 'Stable Video Diffusion', purposes: ['Image-to-Video'] },
  { id: 'svd-xt', name: 'SVD XT', purposes: ['Image-to-Video'] },
  { id: 'stable-video-3', name: 'Stable Video 3', purposes: ['Text-to-Video', 'Image-to-Video'] },
]);

export async function generateWithStability(req: GenerationRequest): Promise<GenerationResult> {
  try {
    const image = pickImageInput(req.refs);
    if (!image) {
      return { status: 'error', error: 'Stability video generation requires a Subject or Backdrop reference image' };
    }

    const imageUrl = resolveRefUrl(image);
    const form = new FormData();
    form.append('image', await fetch(imageUrl).then((r) => r.blob()), 'reference.jpg');
    form.append('seed', '0');
    form.append('cfg_scale', '1.8');
    form.append('motion_bucket_id', '127');

    const res = await fetch('https://api.stability.ai/v2beta/image-to-video', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.apiKey}`,
        accept: 'application/json',
      },
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { status: 'error', error: mapHttpError(res.status, text || 'Stability generation failed') };
    }

    const data = (await res.json()) as { id?: string; video?: string };
    if (data.video) {
      return {
        status: 'complete',
        videoUrl: data.video.startsWith('data:') ? data.video : `data:video/mp4;base64,${data.video}`,
        posterUrl: imageUrl,
        providerJobId: data.id,
      };
    }

    return { status: 'error', error: 'No video returned from Stability AI' };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Stability generation failed' };
  }
}

export async function testStability(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch('https://api.stability.ai/v1/user/account', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'Stability connection failed'), latencyMs };
    }

    const modalities = unionModalities(STABILITY_MODELS);
    return {
      ok: true,
      message: `Stability API key verified — ${STABILITY_MODELS.length} models available`,
      models: STABILITY_MODELS,
      modalities,
      purposes: ['Text-to-Video', 'Image-to-Video'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Stability AI' };
  }
}