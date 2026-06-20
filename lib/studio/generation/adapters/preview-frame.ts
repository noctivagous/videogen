import { resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  formatApiError,
  mapHttpError,
  NO_MODEL_SELECTED_ERROR,
  requireModelId,
} from '@/lib/studio/generation/adapters/shared';
import { wrapProgressReporter } from '@/lib/studio/generation/progress';
import type { PreviewFrameRequest, PreviewFrameResult } from '@/lib/studio/generation/preview-frame-types';

const XAI_API = 'https://api.x.ai/v1';
const OPENAI_API = 'https://api.openai.com/v1';

function parseImageGenerationResponse(
  data: { data?: Array<{ url?: string; b64_json?: string }> },
  providerLabel: string,
): PreviewFrameResult {
  const item = data.data?.[0];
  if (!item) return { status: 'error', error: `${providerLabel} returned no image` };
  if (item.url) return { status: 'complete', imageUrl: item.url };
  if (item.b64_json) {
    return { status: 'complete', imageUrl: `data:image/png;base64,${item.b64_json}` };
  }
  return { status: 'error', error: `${providerLabel} returned an unsupported image format` };
}

async function generateWithXAIImage(req: PreviewFrameRequest): Promise<PreviewFrameResult> {
  const report = wrapProgressReporter(req.onProgress);
  const modelId = requireModelId(req.modelId);
  if (!modelId) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };

  const refs = req.refs.filter((r) => r.url);
  const resolved = refs.map((r) => resolveRefUrl(r.url));
  const useEditEndpoint = resolved.length > 0;
  const endpoint = useEditEndpoint ? `${XAI_API}/images/edits` : `${XAI_API}/images/generations`;

  if (useEditEndpoint) {
    report({
      message:
        resolved.length >= 2
          ? 'Calling Grok Imagine multi-image edit'
          : 'Calling Grok Imagine image edit',
      detail:
        resolved.length >= 2
          ? `POST /v1/images/edits · ${modelId} · ${resolved.length} source images · ${req.aspectRatio}`
          : `POST /v1/images/edits · ${modelId} · 1 source image · ${req.aspectRatio}`,
    });
  } else {
    report({
      message: 'Calling Grok Imagine image generation',
      detail: `POST /v1/images/generations · ${modelId} · ${req.aspectRatio}`,
    });
  }

  const body: Record<string, unknown> = {
    model: modelId,
    prompt: req.prompt,
    aspect_ratio: req.aspectRatio,
    resolution: '1k',
    n: 1,
  };

  if (resolved.length >= 2) {
    body.images = resolved.map((url) => ({ url, type: 'image_url' }));
  } else if (resolved.length === 1) {
    body.image = { url: resolved[0], type: 'image_url' };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { status: 'error', error: formatApiError(res.status, text, 'xAI image generation failed') };
  }

  report({ message: 'Processing image response', detail: 'Decoding Grok Imagine output' });

  const data = (await res.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };
  return parseImageGenerationResponse(data, 'xAI');
}

async function generateWithOpenAIImage(req: PreviewFrameRequest): Promise<PreviewFrameResult> {
  const report = wrapProgressReporter(req.onProgress);
  const modelId = requireModelId(req.modelId);
  if (!modelId) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };

  const sizeMap: Record<string, string> = {
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '1:1': '1024x1024',
    '4:3': '1024x768',
    '21:9': '1792x768',
  };
  const size = sizeMap[req.aspectRatio] || '1792x1024';

  report({
    message: 'Calling OpenAI image generation',
    detail: `POST /v1/images/generations · ${modelId} · ${size}`,
  });

  const res = await fetch(`${OPENAI_API}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      prompt: req.prompt,
      size,
      n: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { status: 'error', error: mapHttpError(res.status, text || 'OpenAI image generation failed') };
  }

  const data = (await res.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };
  const item = data.data?.[0];
  if (!item) return { status: 'error', error: 'OpenAI returned no image' };
  if (item.url) return { status: 'complete', imageUrl: item.url };
  if (item.b64_json) {
    return { status: 'complete', imageUrl: `data:image/png;base64,${item.b64_json}` };
  }
  return { status: 'error', error: 'OpenAI returned an unsupported image format' };
}

async function generateWithReplicateImage(req: PreviewFrameRequest): Promise<PreviewFrameResult> {
  const report = wrapProgressReporter(req.onProgress);
  const model = requireModelId(req.modelId);
  if (!model) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
  report({
    message: 'Submitting to Replicate',
    detail: `POST /v1/predictions · ${model} · waiting for result`,
  });
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      version: model.includes('/') ? undefined : model,
      model: model.includes('/') ? model : undefined,
      input: {
        prompt: req.prompt,
        aspect_ratio: req.aspectRatio.replace(':', ':'),
        num_outputs: 1,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { status: 'error', error: mapHttpError(res.status, text || 'Replicate image generation failed') };
  }

  const data = (await res.json()) as { output?: string | string[]; error?: string };
  if (data.error) return { status: 'error', error: data.error };
  const out = Array.isArray(data.output) ? data.output[0] : data.output;
  if (!out) return { status: 'error', error: 'Replicate returned no image' };
  return { status: 'complete', imageUrl: out };
}

const IMAGE_PREVIEW_HANDLERS: Record<string, (req: PreviewFrameRequest) => Promise<PreviewFrameResult>> = {
  xai: generateWithXAIImage,
  openai: generateWithOpenAIImage,
  replicate: generateWithReplicateImage,
};

export async function runPreviewFrameGeneration(req: PreviewFrameRequest): Promise<PreviewFrameResult> {
  if (req.isCustom) {
    return generateWithCustomImage(req);
  }
  if (!requireModelId(req.modelId)) {
    return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
  }
  const handler = IMAGE_PREVIEW_HANDLERS[req.providerId];
  if (!handler) {
    return {
      status: 'error',
      error: `${req.providerId} does not support quick preview frames yet. Try xAI, OpenAI, or Replicate.`,
    };
  }
  return handler(req);
}

async function generateWithCustomImage(req: PreviewFrameRequest): Promise<PreviewFrameResult> {
  const modelId = requireModelId(req.modelId);
  if (!modelId) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };

  const base = req.customBaseUrl?.replace(/\/$/, '') || '';
  const res = await fetch(`${base}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      prompt: req.prompt,
      aspect_ratio: req.aspectRatio,
      n: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { status: 'error', error: mapHttpError(res.status, text || 'Custom image generation failed') };
  }

  const data = (await res.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
    url?: string;
  };
  const item = data.data?.[0];
  const url = item?.url || data.url;
  if (url) return { status: 'complete', imageUrl: url };
  if (item?.b64_json) {
    return { status: 'complete', imageUrl: `data:image/png;base64,${item.b64_json}` };
  }
  return { status: 'error', error: 'Custom provider returned no image' };
}