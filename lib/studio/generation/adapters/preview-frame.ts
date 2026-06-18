import {
  formatApiError,
  mapHttpError,
  NO_MODEL_SELECTED_ERROR,
  requireModelId,
} from '@/lib/studio/generation/adapters/shared';
import type { PreviewFrameRequest, PreviewFrameResult } from '@/lib/studio/generation/preview-frame-types';

const XAI_API = 'https://api.x.ai/v1';
const OPENAI_API = 'https://api.openai.com/v1';

async function generateWithXAIImage(req: PreviewFrameRequest): Promise<PreviewFrameResult> {
  const modelId = requireModelId(req.modelId);
  if (!modelId) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
  const res = await fetch(`${XAI_API}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      prompt: req.prompt,
      aspect_ratio: req.aspectRatio,
      resolution: '1k',
      n: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { status: 'error', error: formatApiError(res.status, text, 'xAI image generation failed') };
  }

  const data = (await res.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };
  const item = data.data?.[0];
  if (!item) return { status: 'error', error: 'xAI returned no image' };
  if (item.url) return { status: 'complete', imageUrl: item.url };
  if (item.b64_json) {
    return { status: 'complete', imageUrl: `data:image/png;base64,${item.b64_json}` };
  }
  return { status: 'error', error: 'xAI returned an unsupported image format' };
}

async function generateWithOpenAIImage(req: PreviewFrameRequest): Promise<PreviewFrameResult> {
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
  const model = requireModelId(req.modelId);
  if (!model) return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
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