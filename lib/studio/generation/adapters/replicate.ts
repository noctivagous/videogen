import fs from 'fs';
import path from 'path';
import type { GenerationRequest, GenerationResult } from '@/lib/studio/generation/types';

const MODEL_OWNER = 'minimax';
const MODEL_NAME = 'video-01';
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 90;

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

function pickImageInput(refs: GenerationRequest['refs']): string | undefined {
  const subject = refs.find((r) => r.role === 'Subject');
  if (subject?.url) return subject.url;
  const backdrop = refs.find((r) => r.role === 'Backdrop');
  if (backdrop?.url) return backdrop.url;
  return refs[0]?.url;
}

function resolveRefUrl(url: string): string {
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) {
    const filePath = path.join(process.cwd(), 'public', url);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      const ext = path.extname(url).slice(1).toLowerCase() || 'jpeg';
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  }
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function generateWithReplicate(req: GenerationRequest): Promise<GenerationResult> {
  const image = pickImageInput(req.refs);
  const input: Record<string, unknown> = {
    prompt: req.prompt,
    prompt_optimizer: true,
  };
  if (image) {
    input.first_frame_image = resolveRefUrl(image);
  }

  const prediction = await replicateFetch(
    `/models/${MODEL_OWNER}/${MODEL_NAME}/predictions`,
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
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    result = await replicateFetch(`/predictions/${prediction.id}`, req.apiKey);
    polls++;
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

export async function testReplicate(apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    await replicateFetch('/account', apiKey);
    return { ok: true, message: 'Replicate API key is valid' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Connection failed' };
  }
}