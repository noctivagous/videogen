import { resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  formatApiError,
  NO_MODEL_SELECTED_ERROR,
  parseResolution,
  requireModelId,
  sleep,
  timedFetch,
} from '@/lib/studio/generation/adapters/shared';
import { augmentPromptForXAI } from '@/lib/studio/generation-prompt';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import {
  filterRefsForImageToVideoOnly,
  isXAIImageToVideoOnlyModel,
  normalizeXAIVideoModelId,
} from '@/lib/studio/xai-video-models';
import type { ProviderModel } from '@/lib/types/studio';

const XAI_API = 'https://api.x.ai/v1';
const XAI_VIDEO_POLL_MS = 5000;
const XAI_VIDEO_MAX_POLLS = 58;

function xaiVideoResolution(resolution: string): '720p' | '480p' {
  const { height } = parseResolution(resolution);
  return height >= 720 ? '720p' : '480p';
}

function xaiHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function pollXAIVideo(
  apiKey: string,
  requestId: string,
): Promise<{ videoUrl?: string; error?: string }> {
  for (let poll = 0; poll < XAI_VIDEO_MAX_POLLS; poll++) {
    await sleep(XAI_VIDEO_POLL_MS);

    const res = await fetch(`${XAI_API}/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { error: formatApiError(res.status, text, 'xAI video status check failed') };
    }

    const data = (await res.json()) as {
      status?: string;
      video?: { url?: string };
      error?: { message?: string; code?: string };
    };

    if (data.status === 'done') {
      const videoUrl = data.video?.url;
      if (!videoUrl) return { error: 'xAI returned no video URL' };
      return { videoUrl };
    }

    if (data.status === 'failed') {
      return { error: data.error?.message || 'xAI video generation failed' };
    }

    if (data.status === 'expired') {
      return { error: 'xAI video request expired — try again' };
    }
  }

  return { error: 'xAI video generation timed out — try a shorter clip or simpler prompt' };
}

export async function generateWithXAI(req: GenerationRequest): Promise<GenerationResult> {
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

    const prompt = augmentPromptForXAI(req.prompt, refs, req.cinematographyRefs !== false);

    const body: Record<string, unknown> = {
      model,
      prompt,
      aspect_ratio: req.aspectRatio,
      duration,
      resolution: xaiVideoResolution(req.resolution),
    };

    if (imageToVideoOnly) {
      body.image = { url: resolveRefUrl(refs[0].url) };
    } else if (refs.length >= 2) {
      body.reference_images = refs.map((r) => ({ url: resolveRefUrl(r.url) }));
    } else if (refs.length === 1) {
      body.image = { url: resolveRefUrl(refs[0].url) };
    }

    const res = await fetch(`${XAI_API}/videos/generations`, {
      method: 'POST',
      headers: xaiHeaders(req.apiKey),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { status: 'error', error: formatApiError(res.status, text, 'xAI video generation failed') };
    }

    const started = (await res.json()) as { request_id?: string };
    const requestId = started.request_id;
    if (!requestId) {
      return { status: 'error', error: 'xAI returned no request_id' };
    }

    const polled = await pollXAIVideo(req.apiKey, requestId);
    if (polled.error) {
      return { status: 'error', error: polled.error, providerJobId: requestId };
    }

    return { status: 'complete', videoUrl: polled.videoUrl, providerJobId: requestId };
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
      return { ok: false, message: formatApiError(res.status, text, 'xAI connection failed'), latencyMs };
    }

    const data = (await res.json()) as { data?: Array<{ id: string }> };
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
        latencyMs,
      };
    }

    return {
      ok: true,
      message: `xAI key verified — ${videoCount} video, ${imageCount} image model${videoCount + imageCount === 1 ? '' : 's'}`,
      models,
      modalities: unionModalities(models),
      purposes: ['Text-to-Video', 'Image-to-Video', 'Image Generation'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach xAI' };
  }
}