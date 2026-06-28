import { generateWithFalImage } from '@/lib/studio/generation/adapters/fal';
import { resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  replicateOutputUrl,
  runReplicatePrediction,
} from '@/lib/studio/generation/adapters/replicate-shared';
import {
  formatApiError,
  NO_MODEL_SELECTED_ERROR,
  requireModelId,
} from '@/lib/studio/generation/adapters/shared';
import { DEFAULT_INPAINT_MODEL, DEFAULT_XAI_BAKE_IMAGE_MODEL } from '@/lib/constants/workflows';
import { createReplicateClient } from '@/lib/studio/generation/clients/replicate.client';
import { createXAIClient } from '@/lib/studio/generation/clients/openai.client';
import { wrapProgressReporter } from '@/lib/studio/generation/progress';
import type { InpaintRequest, InpaintResult } from '@/lib/studio/generation/inpaint-types';

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
  const report = wrapProgressReporter(req.onProgress);
  const modelId = requireModelId(req.modelId) ?? DEFAULT_XAI_BAKE_IMAGE_MODEL;
  if (!modelId) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };

  report({
    message: 'Pass 1: Replacing mannequin silhouettes',
    detail: `POST /v1/images/edits · ${modelId}${req.aspectRatio ? ` · ${req.aspectRatio}` : ''}`,
  });

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

  try {
    const client = createXAIClient(req.apiKey);
    const response = await client.post('/images/edits', { body });
    report({ message: 'Pass 1 complete', detail: 'Decoding Grok Imagine edit response' });
    return parseXAIImageResponse(response as { data?: Array<{ url?: string; b64_json?: string }> });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'xAI image edit failed';
    return { status: 'error', error: formatApiError(0, message, 'xAI image edit failed') };
  }
}

export async function generateWithReplicateInpaint(req: InpaintRequest): Promise<InpaintResult> {
  const report = wrapProgressReporter(req.onProgress);
  const modelId = requireModelId(req.modelId) ?? DEFAULT_INPAINT_MODEL;
  if (!modelId) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
  if (!req.maskUrl) {
    return { status: 'error', error: 'Mask URL is required for Replicate inpainting.' };
  }

  try {
    const client = createReplicateClient(req.apiKey);
    const image = resolveRefUrl(req.imageUrl);
    const mask = resolveRefUrl(req.maskUrl);

    const { output, id } = await runReplicatePrediction(
      client,
      modelId,
      { image, mask, prompt: req.prompt },
      report,
      {
        submit: 'Pass 1: FLUX Fill inpainting',
        poll: (status, poll, jobId) => ({
          message: `FLUX Fill ${status}`,
          detail: `Poll ${poll} · job ${jobId}`,
        }),
      },
    );

    return {
      status: 'complete',
      imageUrl: replicateOutputUrl(output, id, 'image'),
      providerJobId: id,
    };
  } catch (e) {
    return {
      status: 'error',
      error: e instanceof Error ? e.message : 'Replicate inpaint failed',
    };
  }
}

export async function generateWithFalInpaint(req: InpaintRequest): Promise<InpaintResult> {
  const report = wrapProgressReporter(req.onProgress);
  const modelId = requireModelId(req.modelId) ?? DEFAULT_INPAINT_MODEL;
  if (!modelId) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
  if (!req.maskUrl) {
    return { status: 'error', error: 'Mask URL is required for Fal inpainting.' };
  }

  try {
    const { imageUrl, requestId } = await generateWithFalImage(
      req.apiKey,
      modelId,
      {
        image_url: resolveRefUrl(req.imageUrl),
        mask_url: resolveRefUrl(req.maskUrl),
        prompt: req.prompt,
      },
      report,
    );

    return { status: 'complete', imageUrl, providerJobId: requestId };
  } catch (e) {
    return {
      status: 'error',
      error: e instanceof Error ? e.message : 'Fal inpaint failed',
    };
  }
}

export async function runInpaintGeneration(req: InpaintRequest): Promise<InpaintResult> {
  if (req.providerId === 'xai') {
    return generateWithXAIInpaint(req);
  }
  if (req.providerId === 'replicate') {
    return generateWithReplicateInpaint(req);
  }
  if (req.providerId === 'fal') {
    return generateWithFalInpaint(req);
  }
  return {
    status: 'error',
    error: `${req.providerId} does not support baking yet. Use xAI, Replicate, or Fal.ai.`,
  };
}
