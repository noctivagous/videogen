import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  mapHttpError,
  NO_MODEL_SELECTED_ERROR,
  requireModelId,
  timedFetch,
} from '@/lib/studio/generation/adapters/shared';
import {
  blobToDataUrl,
  createHfInferenceClient,
} from '@/lib/studio/generation/clients/huggingface.client';
import { wrapProgressReporter } from '@/lib/studio/generation/progress';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';

const HF_VIDEO_MODELS: ProviderModel[] = [
  { id: 'stabilityai/stable-video-diffusion', name: 'Stable Video Diffusion', modalities: ['video'] },
  { id: 'cerspense/zeroscope_v2_XL', name: 'Zeroscope v2 XL', modalities: ['video'] },
  { id: 'tencent/HunyuanVideo', name: 'HunyuanVideo', modalities: ['video'] },
];

async function refUrlToBlob(url: string): Promise<Blob> {
  const resolved = resolveRefUrl(url);
  if (resolved.startsWith('data:')) {
    const res = await fetch(resolved);
    return res.blob();
  }
  const res = await fetch(resolved);
  if (!res.ok) {
    throw new Error(`Could not load reference image (${res.status})`);
  }
  return res.blob();
}

export async function generateWithHuggingFace(req: GenerationRequest): Promise<GenerationResult> {
  const report = wrapProgressReporter(req.onProgress);
  try {
    const model = requireModelId(req.modelId);
    if (!model) {
      return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
    }

    const client = createHfInferenceClient(req.apiKey);
    const image = pickImageInput(req.refs);

    if (image) {
      report({
        message: 'Submitting Hugging Face image-to-video',
        detail: `${model} · image-to-video`,
      });
      const blob = await refUrlToBlob(image);
      const videoBlob = await client.imageToVideo({
        model,
        inputs: blob,
        parameters: { prompt: req.prompt },
      });
      const videoUrl = await blobToDataUrl(videoBlob, videoBlob.type || 'video/mp4');
      return {
        status: 'complete',
        videoUrl,
        posterUrl: resolveRefUrl(image),
      };
    }

    report({
      message: 'Submitting Hugging Face text-to-video',
      detail: `${model} · text-to-video`,
    });
    const videoBlob = await client.textToVideo({
      model,
      inputs: req.prompt,
    });
    const videoUrl = await blobToDataUrl(videoBlob, videoBlob.type || 'video/mp4');
    return { status: 'complete', videoUrl };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Hugging Face generation failed' };
  }
}

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
