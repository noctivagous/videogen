import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  MAX_POLLS,
  NO_MODEL_SELECTED_ERROR,
  POLL_INTERVAL_MS,
  requireModelId,
  sleep,
} from '@/lib/studio/generation/adapters/shared';
import { wrapProgressReporter } from '@/lib/studio/generation/progress';
import type { GenerationRequest, GenerationResult } from '@/lib/studio/generation/types';

async function replicateFetch(path: string, apiKey: string, init?: RequestInit) {
  const res = await fetch(`https://api.replicate.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Replicate API error (${res.status}): ${text}`);
  }
  return res.json();
}

function resolveModelPath(modelId: string): string {
  if (modelId.includes('/')) return `/models/${modelId}/predictions`;
  throw new Error(`Replicate model id must be owner/name format (got "${modelId}")`);
}

export async function generateWithReplicate(req: GenerationRequest): Promise<GenerationResult> {
  const report = wrapProgressReporter(req.onProgress);
  const modelId = requireModelId(req.modelId);
  if (!modelId) {
    return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
  }
  report({
    message: 'Submitting to Replicate',
    detail: `POST /v1/models/${modelId}/predictions`,
  });
  const image = pickImageInput(req.refs);
  const input: Record<string, unknown> = {
    prompt: req.prompt,
    prompt_optimizer: true,
  };
  if (image) {
    input.first_frame_image = resolveRefUrl(image);
  }

  const prediction = await replicateFetch(
    resolveModelPath(modelId),
    req.apiKey,
    { method: 'POST', body: JSON.stringify({ input }) },
  );

  let result = prediction;
  let polls = 0;
  while (
    result.status !== 'succeeded' &&
    result.status !== 'failed' &&
    result.status !== 'canceled' &&
    polls < MAX_POLLS
  ) {
    await sleep(POLL_INTERVAL_MS);
    result = await replicateFetch(`/predictions/${prediction.id}`, req.apiKey);
    polls++;
    report({
      message: `Replicate ${result.status ?? 'processing'}`,
      detail: `Poll ${polls}/${MAX_POLLS} · job ${prediction.id}`,
    });
  }

  if (result.status === 'failed' || result.status === 'canceled') {
    return {
      status: 'error',
      error: result.error || `Generation ${result.status}`,
      providerJobId: prediction.id,
    };
  }

  const output = result.output;
  const videoUrl = Array.isArray(output) ? output[0] : output;
  if (!videoUrl || typeof videoUrl !== 'string') {
    return { status: 'error', error: 'No video URL in response', providerJobId: prediction.id };
  }

  return {
    status: 'complete',
    videoUrl,
    posterUrl: image ? resolveRefUrl(image) : undefined,
    providerJobId: prediction.id,
  };
}

export async function testReplicate(apiKey: string) {
  const start = Date.now();
  try {
    await replicateFetch('/account', apiKey);

    const searchRes = await fetch(
      'https://api.replicate.com/v1/models?query=video',
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    let models: Array<{ id: string; name: string; modalities: Array<'video' | 'image' | 'llm' | 'tts'> }> = [];

    if (searchRes.ok) {
      const data = (await searchRes.json()) as {
        results?: Array<{ owner: string; name: string; description?: string }>;
      };
      models = (data.results ?? [])
        .slice(0, 12)
        .map((m) => ({
          id: `${m.owner}/${m.name}`,
          name: m.name,
          modalities: /video|animate|motion|hailuo|minimax|luma|kling/i.test(`${m.owner}/${m.name}`)
            ? (['video'] as const)
            : (['image'] as const),
        }));
    }

    const modalities = [...new Set(models.flatMap((m) => m.modalities))] as Array<'video' | 'image' | 'llm' | 'tts'>;

    if (models.length === 0) {
      return {
        ok: true,
        message: 'Replicate API key verified — no video/image models returned from search',
        models: [],
        modalities: [],
        purposes: ['Community Models', 'Open Weights'],
        latencyMs: Date.now() - start,
      };
    }

    return {
      ok: true,
      message: `Replicate API key verified — ${models.length} model${models.length === 1 ? '' : 's'} found`,
      models,
      modalities,
      purposes: ['Community Models', 'Open Weights'],
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Connection failed',
      latencyMs: Date.now() - start,
    };
  }
}