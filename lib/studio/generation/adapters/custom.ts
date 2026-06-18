import type { GenerationRequest, GenerationResult } from '@/lib/studio/generation/types';

export async function generateWithCustom(req: GenerationRequest): Promise<GenerationResult> {
  const baseUrl = req.customBaseUrl?.replace(/\/$/, '');
  if (!baseUrl) {
    return { status: 'error', error: 'Custom provider base URL is required' };
  }

  const res = await fetch(`${baseUrl}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      prompt: req.prompt,
      duration: req.duration,
      fps: req.fps,
      resolution: req.resolution,
      aspectRatio: req.aspectRatio,
      refs: req.refs,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { status: 'error', error: `Custom API error (${res.status}): ${text}` };
  }

  const data = (await res.json()) as { videoUrl?: string; posterUrl?: string; error?: string };
  if (data.error) return { status: 'error', error: data.error };
  if (!data.videoUrl) return { status: 'error', error: 'No videoUrl in custom API response' };

  return {
    status: 'complete',
    videoUrl: data.videoUrl,
    posterUrl: data.posterUrl,
  };
}

export async function testCustom(baseUrl: string, apiKey: string): Promise<{ ok: boolean; message: string }> {
  const url = baseUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${url}/health`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) return { ok: true, message: 'Custom endpoint responded' };
    return { ok: false, message: `Endpoint returned ${res.status}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Connection failed' };
  }
}