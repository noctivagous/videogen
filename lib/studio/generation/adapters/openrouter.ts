import { resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  NO_MODEL_SELECTED_ERROR,
  parseResolution,
  requireModelId,
  sleep,
} from '@/lib/studio/generation/adapters/shared';
import { createOpenRouterClient } from '@/lib/studio/generation/clients/openrouter.client';
import { wrapProgressReporter } from '@/lib/studio/generation/progress';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';
import type { VideoGenerationRequest } from '@openrouter/sdk/models/videogenerationrequest.js';

const OR_POLL_MS = 5000;
const OR_MAX_POLLS = 120;

function openRouterResolution(resolution: string): '480p' | '720p' | '1080p' {
  const { height } = parseResolution(resolution);
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  return '480p';
}

function buildOpenRouterVideoRequest(req: GenerationRequest, model: string): VideoGenerationRequest {
  const refs = req.refs.filter((r) => r.url);
  const subject = refs.find((r) => r.role === 'Subject');
  const duration = Math.min(Math.max(Math.round(req.duration), 1), 30);

  const base: VideoGenerationRequest = {
    model,
    prompt: req.prompt,
    aspectRatio: req.aspectRatio as VideoGenerationRequest['aspectRatio'],
    resolution: openRouterResolution(req.resolution),
    duration,
  };

  if (refs.length === 0) {
    return base;
  }

  if (refs.length === 1) {
    const url = resolveRefUrl((subject ?? refs[0]).url);
    return {
      ...base,
      frameImages: [
        {
          imageUrl: { url },
          type: 'image_url',
          frameType: 'first_frame',
        },
      ],
    };
  }

  return {
    ...base,
    inputReferences: refs.map((ref) => ({
      imageUrl: { url: resolveRefUrl(ref.url) },
      type: 'image_url' as const,
    })),
  };
}

async function pollOpenRouterVideo(
  client: ReturnType<typeof createOpenRouterClient>,
  jobId: string,
  report: ReturnType<typeof wrapProgressReporter>,
): Promise<{ videoUrl?: string; error?: string }> {
  for (let poll = 1; poll <= OR_MAX_POLLS; poll++) {
    await sleep(OR_POLL_MS);

    const job = await client.videoGeneration.getGeneration({ jobId });

    if (job.status === 'completed') {
      report({
        message: 'Video render complete',
        detail: `Job ${jobId.slice(0, 8)}… — downloading result`,
      });
      const videoUrl = job.unsignedUrls?.[0];
      if (!videoUrl) return { error: 'OpenRouter returned no video URL' };
      return { videoUrl };
    }

    if (job.status === 'failed' || job.status === 'cancelled' || job.status === 'expired') {
      return { error: job.error || `OpenRouter job ${job.status}` };
    }

    report({
      message: `OpenRouter ${job.status.replace('_', ' ')}`,
      detail: `Poll ${poll}/${OR_MAX_POLLS} · job ${jobId.slice(0, 8)}…`,
    });
  }

  return { error: 'OpenRouter video generation timed out' };
}

export async function generateWithOpenRouter(req: GenerationRequest): Promise<GenerationResult> {
  const report = wrapProgressReporter(req.onProgress);
  try {
    const model = requireModelId(req.modelId);
    if (!model) {
      return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
    }

    const client = createOpenRouterClient(req.apiKey);
    const videoGenerationRequest = buildOpenRouterVideoRequest(req, model);
    const mode = videoGenerationRequest.frameImages
      ? 'image-to-video'
      : videoGenerationRequest.inputReferences
        ? 'reference-to-video'
        : 'text-to-video';

    report({
      message: 'Submitting OpenRouter video job',
      detail: `${model} · ${mode} · ${videoGenerationRequest.duration ?? req.duration}s`,
    });

    const job = await client.videoGeneration.generate({ videoGenerationRequest });

    report({
      message: 'Video job queued',
      detail: `Job ${job.id} — polling until completed`,
    });

    const polled = await pollOpenRouterVideo(client, job.id, report);
    if (polled.error) {
      return { status: 'error', error: polled.error, providerJobId: job.id };
    }

    const posterRef = req.refs.find((r) => r.url);
    return {
      status: 'complete',
      videoUrl: polled.videoUrl,
      posterUrl: posterRef ? resolveRefUrl(posterRef.url) : undefined,
      providerJobId: job.id,
    };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'OpenRouter generation failed' };
  }
}

export async function testOpenRouter(apiKey: string): Promise<ProviderTestResult> {
  const start = Date.now();
  try {
    const client = createOpenRouterClient(apiKey);
    const keyMeta = await client.apiKeys.getCurrentKeyMetadata();
    const label = keyMeta.data?.label ?? 'your account';

    let models: ProviderModel[] = [];
    try {
      const catalog = await client.videoGeneration.listVideosModels();
      models = (catalog.data ?? [])
        .slice(0, 24)
        .map((entry) => ({
          id: entry.id,
          name: entry.name ?? entry.id,
          modalities: inferModalitiesFromModelId(entry.id).includes('video')
            ? inferModalitiesFromModelId(entry.id)
            : ['video'],
        }));
    } catch {
      // Fall back to verified key without video catalog
    }

    return {
      ok: true,
      message: models.length > 0
        ? `OpenRouter API key verified for ${label} — ${models.length} video model${models.length === 1 ? '' : 's'} found`
        : `OpenRouter API key verified for ${label}`,
      models,
      modalities: models.length > 0 ? unionModalities(models) : ['video', 'image', 'llm'],
      purposes: ['Model Routing', 'Unified Billing', 'OpenAI-compatible'],
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach OpenRouter' };
  }
}
