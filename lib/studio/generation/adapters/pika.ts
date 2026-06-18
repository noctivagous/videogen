import { LEGACY_MODEL_ALIASES } from '@/lib/constants/provider-models';
import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  falVideoDuration,
  falVideoResolution,
  pollFalQueueResult,
  searchFalModels,
  submitFalQueue,
} from '@/lib/studio/generation/adapters/fal';
import {
  NO_MODEL_SELECTED_ERROR,
  requireModelId,
} from '@/lib/studio/generation/adapters/shared';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';

const PIKA_ENDPOINT_PREFIX = 'fal-ai/pika/';
const PIKA_VIDEO_CATEGORIES = new Set(['text-to-video', 'image-to-video', 'video-to-video']);

function normalizePikaModelId(modelId: string): string {
  return LEGACY_MODEL_ALIASES[modelId] ?? modelId;
}

function isPikaVideoEndpoint(endpointId: string): boolean {
  return endpointId.startsWith(PIKA_ENDPOINT_PREFIX);
}

function mapFalModelsToProviderModels(entries: Awaited<ReturnType<typeof searchFalModels>>): ProviderModel[] {
  return entries
    .filter((entry) => isPikaVideoEndpoint(entry.endpoint_id))
    .filter((entry) => PIKA_VIDEO_CATEGORIES.has(entry.metadata?.category ?? ''))
    .map((entry) => ({
      id: entry.endpoint_id,
      name: entry.metadata?.display_name ?? entry.endpoint_id,
      modalities: inferModalitiesFromModelId(entry.endpoint_id),
      purposes: entry.metadata?.category ? [entry.metadata.category] : undefined,
    }))
    .filter((model) => model.modalities.includes('video'));
}

function buildPikaInput(
  endpointId: string,
  req: GenerationRequest,
  imageUrl?: string,
): Record<string, unknown> | { error: string; } {
  const prompt = req.prompt;
  const resolution = falVideoResolution(req.resolution);
  const duration = falVideoDuration(req.duration);

  if (endpointId.endsWith('/text-to-video')) {
    return {
      prompt,
      aspect_ratio: req.aspectRatio,
      resolution,
      duration,
    };
  }

  if (endpointId.endsWith('/image-to-video')) {
    if (!imageUrl) {
      return { error: 'Pika image-to-video requires a Subject or Backdrop reference image' };
    }
    return {
      image_url: imageUrl,
      prompt,
      resolution,
      duration,
    };
  }

  if (endpointId.endsWith('/pikascenes')) {
    if (!imageUrl) {
      return { error: 'Pika Scenes requires a Subject or Backdrop reference image' };
    }
    return {
      image_urls: [imageUrl],
      prompt,
      resolution,
      duration,
      aspect_ratio: req.aspectRatio,
    };
  }

  if (endpointId.endsWith('/pikaffects')) {
    if (!imageUrl) {
      return { error: 'Pika Effects requires a Subject or Backdrop reference image' };
    }
    return {
      image_url: imageUrl,
      pikaffect: 'Squish',
      prompt,
    };
  }

  if (endpointId.endsWith('/pikaframes')) {
    if (!imageUrl) {
      return { error: 'Pikaframes requires a Subject or Backdrop reference image' };
    }
    return {
      image_urls: [imageUrl, imageUrl],
      prompt,
      resolution,
    };
  }

  return { error: `Unsupported Pika endpoint: ${endpointId}` };
}

export async function generateWithPika(req: GenerationRequest): Promise<GenerationResult> {
  try {
    const selected = requireModelId(req.modelId);
    if (!selected) {
      return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
    }

    const endpointId = normalizePikaModelId(selected);
    const image = pickImageInput(req.refs);
    const imageUrl = image ? resolveRefUrl(image) : undefined;
    const input = buildPikaInput(endpointId, req, imageUrl);

    if ('error' in input && typeof input.error === 'string') {
      return { status: 'error', error: input.error };
    }

    const { requestId } = await submitFalQueue(endpointId, req.apiKey, input);
    const polled = await pollFalQueueResult(endpointId, req.apiKey, requestId);

    if (polled.error) {
      return { status: 'error', error: polled.error, providerJobId: requestId };
    }

    return {
      status: 'complete',
      videoUrl: polled.videoUrl,
      posterUrl: imageUrl,
      providerJobId: requestId,
    };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Pika generation failed' };
  }
}

export async function testPika(apiKey: string): Promise<ProviderTestResult> {
  const start = Date.now();
  try {
    const entries = await searchFalModels(apiKey, { q: 'pika' });
    const models = mapFalModelsToProviderModels(entries);

    if (models.length === 0) {
      return {
        ok: true,
        message: 'fal.ai API key verified — no active Pika video models found',
        models: [],
        modalities: [],
        purposes: ['Text-to-Video', 'Image-to-Video', 'Effects'],
        latencyMs: Date.now() - start,
      };
    }

    return {
      ok: true,
      message: `fal.ai key verified — ${models.length} Pika model${models.length === 1 ? '' : 's'} found`,
      models,
      modalities: unionModalities(models),
      purposes: ['Text-to-Video', 'Image-to-Video', 'Effects', 'Lip Sync'],
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Could not reach fal.ai for Pika',
      latencyMs: Date.now() - start,
    };
  }
}