import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  falResultImageUrl,
  falResultVideoUrl,
  runFalSubscribe,
} from '@/lib/studio/generation/adapters/fal-shared';
import {
  NO_MODEL_SELECTED_ERROR,
  parseResolution,
  requireModelId,
} from '@/lib/studio/generation/adapters/shared';
import {
  createFalClient,
  searchFalPlatformModels,
  type FalModelEntry,
} from '@/lib/studio/generation/clients/fal.client';
import { wrapProgressReporter } from '@/lib/studio/generation/progress';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';

export type { FalModelEntry };

export function falVideoResolution(resolution: string): '720p' | '1080p' {
  const { height } = parseResolution(resolution);
  return height >= 1080 ? '1080p' : '720p';
}

export function falVideoDuration(seconds: number): 5 | 10 {
  return seconds >= 8 ? 10 : 5;
}

export async function searchFalModels(
  apiKey: string,
  params: Record<string, string>,
): Promise<FalModelEntry[]> {
  return searchFalPlatformModels(apiKey, params);
}

export function mapFalCatalogModels(entries: FalModelEntry[]): ProviderModel[] {
  return entries
    .map((entry) => ({
      id: entry.endpoint_id,
      name: entry.metadata?.display_name ?? entry.endpoint_id,
      modalities: inferModalitiesFromModelId(entry.endpoint_id),
      purposes: entry.metadata?.category ? [entry.metadata.category] : undefined,
    }))
    .filter((model) => model.modalities.some((mod) => mod === 'video' || mod === 'image'));
}

export async function testFal(apiKey: string): Promise<ProviderTestResult> {
  const start = Date.now();
  try {
    const entries = await searchFalModels(apiKey, {});
    const models = mapFalCatalogModels(entries);

    if (models.length === 0) {
      return {
        ok: true,
        message: 'fal.ai API key verified — no video/image models returned from catalog search',
        models: [],
        modalities: [],
        purposes: ['Text-to-Video', 'Image-to-Video', 'Serverless'],
        latencyMs: Date.now() - start,
      };
    }

    const videoCount = models.filter((m) => m.modalities.includes('video')).length;
    return {
      ok: true,
      message: `fal.ai API key verified — ${videoCount} video model${videoCount === 1 ? '' : 's'} found (${models.length} media endpoints)`,
      models: models.slice(0, 24),
      modalities: unionModalities(models),
      purposes: ['Text-to-Video', 'Image-to-Video', 'Serverless'],
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Could not reach fal.ai',
      latencyMs: Date.now() - start,
    };
  }
}

function buildFalVideoInput(
  endpointId: string,
  req: GenerationRequest,
  imageUrl?: string,
): Record<string, unknown> | { error: string } {
  const prompt = req.prompt;
  const resolution = falVideoResolution(req.resolution);
  const duration = falVideoDuration(req.duration);

  if (endpointId.includes('image-to-video') || endpointId.includes('img2vid')) {
    if (!imageUrl) {
      return { error: 'Fal image-to-video requires a Subject or Backdrop reference image' };
    }
    return {
      prompt,
      image_url: imageUrl,
      aspect_ratio: req.aspectRatio,
      resolution,
      duration,
    };
  }

  if (imageUrl) {
    return {
      prompt,
      image_url: imageUrl,
      aspect_ratio: req.aspectRatio,
      resolution,
      duration,
    };
  }

  return {
    prompt,
    aspect_ratio: req.aspectRatio,
    resolution,
    duration,
  };
}

export async function generateWithFal(req: GenerationRequest): Promise<GenerationResult> {
  const report = wrapProgressReporter(req.onProgress);
  try {
    const endpointId = requireModelId(req.modelId);
    if (!endpointId) {
      return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
    }

    const client = createFalClient(req.apiKey);
    const image = pickImageInput(req.refs);
    const imageUrl = image ? resolveRefUrl(image) : undefined;
    const input = buildFalVideoInput(endpointId, req, imageUrl);

    if ('error' in input && typeof input.error === 'string') {
      return { status: 'error', error: input.error };
    }

    const { data, requestId } = await runFalSubscribe(client, endpointId, input, report, {
      submit: 'Submitting to fal.ai',
    });

    return {
      status: 'complete',
      videoUrl: falResultVideoUrl(data),
      posterUrl: imageUrl,
      providerJobId: requestId,
    };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Fal generation failed' };
  }
}

export async function generateWithFalImage(
  apiKey: string,
  endpointId: string,
  input: Record<string, unknown>,
  report?: ReturnType<typeof wrapProgressReporter>,
): Promise<{ imageUrl: string; requestId: string }> {
  const client = createFalClient(apiKey);
  const { data, requestId } = await runFalSubscribe(client, endpointId, input, report, {
    submit: 'Submitting image job to fal.ai',
  });
  return { imageUrl: falResultImageUrl(data), requestId };
}
