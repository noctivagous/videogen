import { resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  formatApiError,
  NO_MODEL_SELECTED_ERROR,
  parseResolution,
  requireModelId,
  sleep,
} from '@/lib/studio/generation/adapters/shared';
import { augmentPromptForXAI } from '@/lib/studio/generation-prompt';
import { hasPromptImageReferences } from '@/lib/studio/prompt-mentions';
import { createXAIClient } from '@/lib/studio/generation/clients/openai.client';
import { formatXAIVideoPollStatus, wrapProgressReporter } from '@/lib/studio/generation/progress';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import {
  filterRefsForImageToVideoOnly,
  isXAIImageToVideoOnlyModel,
  normalizeXAIVideoModelId,
} from '@/lib/studio/xai-video-models';
import type { ProviderModel } from '@/lib/types/studio';

const XAI_VIDEO_POLL_MS = 5000;
const XAI_VIDEO_MAX_POLLS = 58;

function xaiVideoResolution(resolution: string): '720p' | '480p' {
  const { height } = parseResolution(resolution);
  return height >= 720 ? '720p' : '480p';
}

async function pollXAIVideo(
  client: ReturnType<typeof createXAIClient>,
  requestId: string,
  report: ReturnType<typeof wrapProgressReporter>,
): Promise<{ videoUrl?: string; error?: string }> {
  for (let poll = 1; poll <= XAI_VIDEO_MAX_POLLS; poll++) {
    await sleep(XAI_VIDEO_POLL_MS);

    let data: {
      status?: string;
      video?: { url?: string };
      error?: { message?: string; code?: string };
    };

    try {
      data = await client.get(`/videos/${requestId}`) as typeof data;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'xAI video status check failed';
      return { error: formatApiError(0, message, 'xAI video status check failed') };
    }

    if (data.status === 'done') {
      report({
        message: 'Video render complete',
        detail: `Job ${requestId.slice(0, 8)}… — downloading result`,
      });
      const videoUrl = data.video?.url;
      if (!videoUrl) return { error: 'xAI returned no video URL' };
      return { videoUrl };
    }

    if (data.status === 'failed') {
      const code = data.error?.code ? ` [${data.error.code}]` : '';
      return { error: `${data.error?.message || 'xAI video generation failed'}${code}` };
    }

    if (data.status === 'expired') {
      return { error: 'xAI video request expired — try again' };
    }

    report({
      message: formatXAIVideoPollStatus(data.status, poll, XAI_VIDEO_MAX_POLLS),
      detail: `Job ${requestId.slice(0, 8)}… — xAI polls every ${XAI_VIDEO_POLL_MS / 1000}s while status is pending`,
    });
  }

  return { error: 'xAI video generation timed out — try a shorter clip or simpler prompt' };
}

export async function generateWithXAI(req: GenerationRequest): Promise<GenerationResult> {
  const report = wrapProgressReporter(req.onProgress);
  try {
    const selected = requireModelId(req.modelId);
    if (!selected) {
      return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
    }
    const model = normalizeXAIVideoModelId(selected);
    const duration = Math.min(Math.max(Math.round(req.duration), 1), 15);
    const imageToVideoOnly = isXAIImageToVideoOnlyModel(model);

    let refs = req.refs.filter((r) => r.url);
    if (imageToVideoOnly) {
      refs = filterRefsForImageToVideoOnly(refs);
      if (refs.length === 0) {
        return {
          status: 'error',
          error: 'grok-imagine-video-1.5 requires a starting image in Image 1 (image-to-video only)',
        };
      }
    }

    const videoMode =
      imageToVideoOnly || refs.length === 1
        ? 'image-to-video'
        : refs.length >= 2
          ? 'reference-to-video'
          : 'text-to-video';

    report({
      message: 'Preparing Grok Imagine video request',
      detail: `${model} · ${videoMode} · ${duration}s · ${xaiVideoResolution(req.resolution)} · ${req.aspectRatio}`,
    });

    const prompt = hasPromptImageReferences(req.prompt)
      ? req.prompt
      : augmentPromptForXAI(req.prompt, refs, req.cinematographyRefs !== false);

    const body: Record<string, unknown> = {
      model,
      prompt,
      aspect_ratio: req.aspectRatio,
      duration,
      resolution: xaiVideoResolution(req.resolution),
    };

    const client = createXAIClient(req.apiKey);

    if (imageToVideoOnly) {
      report({ message: 'Uploading start frame', detail: 'POST /v1/videos/generations with image' });
      body.image = { url: resolveRefUrl(refs[0].url) };
    } else if (refs.length >= 2) {
      report({
        message: 'Uploading reference images',
        detail: `POST /v1/videos/generations with ${refs.length} reference_images`,
      });
      body.reference_images = refs.map((r) => ({ url: resolveRefUrl(r.url) }));
    } else if (refs.length === 1) {
      report({ message: 'Uploading start frame', detail: 'POST /v1/videos/generations with image' });
      body.image = { url: resolveRefUrl(refs[0].url) };
    } else {
      report({ message: 'Submitting text-to-video prompt', detail: 'POST /v1/videos/generations' });
    }

    const started = await client.post('/videos/generations', { body }) as { request_id?: string };
    const requestId = started.request_id;
    if (!requestId) {
      return { status: 'error', error: 'xAI returned no request_id' };
    }

    report({
      message: 'Video job queued',
      detail: `request_id ${requestId} — polling GET /v1/videos/{request_id} until status is done`,
    });

    const polled = await pollXAIVideo(client, requestId, report);
    if (polled.error) {
      return { status: 'error', error: polled.error, providerJobId: requestId };
    }

    return { status: 'complete', videoUrl: polled.videoUrl, providerJobId: requestId };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'xAI generation failed' };
  }
}

export async function testXAI(apiKey: string): Promise<ProviderTestResult> {
  const start = Date.now();
  try {
    const client = createXAIClient(apiKey);
    const data = await client.models.list() as { data?: Array<{ id: string }> };
    const raw = data.data ?? [];
    const models: ProviderModel[] = raw
      .map((m) => ({
        id: m.id,
        name: m.id,
        modalities: inferModalitiesFromModelId(m.id),
      }))
      .filter((m) => m.modalities.includes('video') || m.modalities.includes('image'));

    const videoCount = models.filter((m) => m.modalities.includes('video')).length;
    const imageCount = models.filter((m) => m.modalities.includes('image')).length;

    if (videoCount === 0) {
      return {
        ok: true,
        message: `xAI key verified — ${imageCount} image model${imageCount === 1 ? '' : 's'}, no video models on this key`,
        models,
        modalities: unionModalities(models),
        purposes: ['Text-to-Video', 'Image-to-Video', 'Image Generation'],
        latencyMs: Date.now() - start,
      };
    }

    return {
      ok: true,
      message: `xAI key verified — ${videoCount} video, ${imageCount} image model${videoCount + imageCount === 1 ? '' : 's'}`,
      models,
      modalities: unionModalities(models),
      purposes: ['Text-to-Video', 'Image-to-Video', 'Image Generation'],
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach xAI' };
  }
}
