import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  NO_MODEL_SELECTED_ERROR,
  requireModelId,
  sleep,
} from '@/lib/studio/generation/adapters/shared';
import { createTogetherClient } from '@/lib/studio/generation/clients/together.client';
import { wrapProgressReporter } from '@/lib/studio/generation/progress';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';
import type { VideoCreateParams } from 'together-ai/resources/videos';

const TOGETHER_POLL_MS = 5000;
const TOGETHER_MAX_POLLS = 120;

function buildTogetherVideoParams(req: GenerationRequest, model: string): VideoCreateParams {
  const refs = req.refs.filter((r) => r.url);
  const duration = String(Math.min(Math.max(Math.round(req.duration), 1), 15));
  const params: VideoCreateParams = {
    model,
    prompt: req.prompt,
    ratio: req.aspectRatio,
    seconds: duration,
  };

  if (refs.length === 0) {
    return params;
  }

  if (refs.length === 1) {
    const image = resolveRefUrl(refs[0].url);
    params.media = {
      frame_images: [{ input_image: image, frame: 'first' }],
    };
    return params;
  }

  params.media = {
    reference_images: refs.map((ref) => resolveRefUrl(ref.url)),
  };
  return params;
}

async function pollTogetherVideo(
  client: ReturnType<typeof createTogetherClient>,
  jobId: string,
  report: ReturnType<typeof wrapProgressReporter>,
): Promise<{ videoUrl?: string; error?: string }> {
  for (let poll = 1; poll <= TOGETHER_MAX_POLLS; poll++) {
    await sleep(TOGETHER_POLL_MS);

    const job = await client.videos.retrieve(jobId);

    if (job.status === 'completed') {
      report({
        message: 'Video render complete',
        detail: `Job ${jobId.slice(0, 8)}… — downloading result`,
      });
      const videoUrl = job.outputs?.video_url;
      if (!videoUrl) return { error: 'Together AI returned no video URL' };
      return { videoUrl };
    }

    if (job.status === 'failed') {
      const code = job.error?.code ? ` [${job.error.code}]` : '';
      return { error: `${job.error?.message || 'Together AI video generation failed'}${code}` };
    }

    report({
      message: `Together AI ${job.status.replace('_', ' ')}`,
      detail: `Poll ${poll}/${TOGETHER_MAX_POLLS} · job ${jobId.slice(0, 8)}…`,
    });
  }

  return { error: 'Together AI video generation timed out' };
}

export async function generateWithTogether(req: GenerationRequest): Promise<GenerationResult> {
  const report = wrapProgressReporter(req.onProgress);
  try {
    const model = requireModelId(req.modelId);
    if (!model) {
      return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
    }

    const client = createTogetherClient(req.apiKey);
    const body = buildTogetherVideoParams(req, model);
    const mode = body.media?.frame_images
      ? 'image-to-video'
      : body.media?.reference_images
        ? 'reference-to-video'
        : 'text-to-video';

    report({
      message: 'Submitting Together AI video job',
      detail: `${model} · ${mode} · ${body.seconds ?? req.duration}s`,
    });

    const job = await client.videos.create(body);

    report({
      message: 'Video job queued',
      detail: `Job ${job.id} — polling until completed`,
    });

    const polled = await pollTogetherVideo(client, job.id, report);
    if (polled.error) {
      return { status: 'error', error: polled.error, providerJobId: job.id };
    }

    const image = pickImageInput(req.refs);
    return {
      status: 'complete',
      videoUrl: polled.videoUrl,
      posterUrl: image ? resolveRefUrl(image) : undefined,
      providerJobId: job.id,
    };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Together AI generation failed' };
  }
}

export async function testTogether(apiKey: string): Promise<ProviderTestResult> {
  const start = Date.now();
  try {
    const client = createTogetherClient(apiKey);
    const raw = await client.models.list();
    const models: ProviderModel[] = raw
      .filter((entry) => entry.id)
      .map((entry) => ({
        id: entry.id,
        name: entry.display_name ?? entry.id,
        modalities: inferModalitiesFromModelId(entry.id),
        purposes: entry.type ? [entry.type] : undefined,
      }))
      .filter((model) => model.modalities.length > 0);

    const catalog = models.length > 0 ? models.slice(0, 24) : [];
    return {
      ok: true,
      message: catalog.length > 0
        ? `Together AI API key verified — ${catalog.length} media-capable model${catalog.length === 1 ? '' : 's'} found`
        : `Together AI API key verified — ${raw.length} model${raw.length === 1 ? '' : 's'} available`,
      models: catalog,
      modalities: catalog.length > 0 ? unionModalities(catalog) : ['llm'],
      purposes: ['Open Models', 'Fast Inference'],
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Together AI' };
  }
}
