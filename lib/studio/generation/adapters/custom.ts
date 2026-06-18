import { mapHttpError } from '@/lib/studio/generation/adapters/shared';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';

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

async function fetchCustomModels(baseUrl: string, apiKey: string): Promise<ProviderModel[]> {
  const url = baseUrl.replace(/\/$/, '');
  const res = await fetch(`${url}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { data?: Array<{ id: string }> } | Array<{ id: string }>;
  const raw = Array.isArray(data) ? data : data.data ?? [];
  return raw.map((m) => ({
    id: m.id,
    name: m.id,
    modalities: inferModalitiesFromModelId(m.id),
  })).filter((m) => m.modalities.length > 0);
}

export async function testCustom(baseUrl: string, apiKey: string): Promise<ProviderTestResult> {
  const url = baseUrl.replace(/\/$/, '');
  const start = Date.now();
  try {
    const res = await fetch(`${url}/health`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return {
        ok: false,
        message: mapHttpError(res.status, `Endpoint returned ${res.status}`),
        latencyMs: Date.now() - start,
      };
    }

    let models: ProviderModel[] = [];
    try {
      models = await fetchCustomModels(url, apiKey);
    } catch {
      // /models is optional for custom providers
    }

    const modalities = models.length > 0 ? unionModalities(models) : undefined;

    return {
      ok: true,
      message: models.length > 0
        ? `Custom endpoint verified — ${models.length} model${models.length === 1 ? '' : 's'} found`
        : 'Custom endpoint responded (no /models catalog)',
      models: models.length > 0 ? models : undefined,
      modalities,
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