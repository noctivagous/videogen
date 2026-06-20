import { resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  formatApiError,
  MAX_POLLS,
  NO_MODEL_SELECTED_ERROR,
  POLL_INTERVAL_MS,
  requireModelId,
  sleep,
} from '@/lib/studio/generation/adapters/shared';
import { DEFAULT_INPAINT_MODEL, DEFAULT_XAI_BAKE_IMAGE_MODEL } from '@/lib/constants/workflows';
import type { InpaintRequest, InpaintResult } from '@/lib/studio/generation/inpaint-types';

const XAI_API = 'https://api.x.ai/v1';

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

function parseXAIImageResponse(
  data: { data?: Array<{ url?: string; b64_json?: string }> },
): InpaintResult {
  const item = data.data?.[0];
  if (!item) return { status: 'error', error: 'xAI returned no image' };
  if (item.url) return { status: 'complete', imageUrl: item.url };
  if (item.b64_json) {
    return { status: 'complete', imageUrl: `data:image/png;base64,${item.b64_json}` };
  }
  return { status: 'error', error: 'xAI returned an unsupported image format' };
}

export async function generateWithXAIInpaint(req: InpaintRequest): Promise<InpaintResult> {
  const modelId = requireModelId(req.modelId) ?? DEFAULT_XAI_BAKE_IMAGE_MODEL;
  if (!modelId) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };

  const image = resolveRefUrl(req.imageUrl);
  const body: Record<string, unknown> = {
    model: modelId,
    prompt: req.prompt,
    image: { url: image, type: 'image_url' },
    n: 1,
  };
  if (req.aspectRatio) {
    body.aspect_ratio = req.aspectRatio;
    body.resolution = '1k';
  }

  const res = await fetch(`${XAI_API}/images/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { status: 'error', error: formatApiError(res.status, text, 'xAI image edit failed') };
  }

  const data = (await res.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };
  return parseXAIImageResponse(data);
}

export async function generateWithReplicateInpaint(req: InpaintRequest): Promise<InpaintResult> {
  const modelId = requireModelId(req.modelId) ?? DEFAULT_INPAINT_MODEL;
  if (!modelId) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
  if (!req.maskUrl) {
    return { status: 'error', error: 'Mask URL is required for Replicate inpainting.' };
  }

  const image = resolveRefUrl(req.imageUrl);
  const mask = resolveRefUrl(req.maskUrl);

  const prediction = await replicateFetch(resolveModelPath(modelId), req.apiKey, {
    method: 'POST',
    body: JSON.stringify({
      input: {
        image,
        mask,
        prompt: req.prompt,
      },
    }),
  });

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
  }

  if (result.status === 'failed' || result.status === 'canceled') {
    return {
      status: 'error',
      error: result.error || `Inpaint ${result.status}`,
      providerJobId: prediction.id,
    };
  }

  const output = result.output;
  const imageUrl = Array.isArray(output) ? output[0] : output;
  if (!imageUrl || typeof imageUrl !== 'string') {
    return { status: 'error', error: 'No image URL in inpaint response', providerJobId: prediction.id };
  }

  return { status: 'complete', imageUrl, providerJobId: prediction.id };
}

export async function runInpaintGeneration(req: InpaintRequest): Promise<InpaintResult> {
  if (req.providerId === 'xai') {
    return generateWithXAIInpaint(req);
  }
  if (req.providerId === 'replicate') {
    return generateWithReplicateInpaint(req);
  }
  return {
    status: 'error',
    error: `${req.providerId} does not support baking yet. Use xAI or Replicate.`,
  };
}