import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  buildModels,
  mapHttpError,
  MAX_POLLS,
  POLL_INTERVAL_MS,
  sleep,
  timedFetch,
} from '@/lib/studio/generation/adapters/shared';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { unionModalities } from '@/lib/studio/provider-modalities';

const PIKA_API = 'https://api.pika.art/v1';
const PIKA_MODELS = buildModels([
  { id: 'pika-2.2', name: 'Pika 2.2', purposes: ['Text-to-Video'] },
  { id: 'pika-effects', name: 'Pika Effects', purposes: ['Effects'] },
  { id: 'pika-lip-sync', name: 'Pika Lip Sync', purposes: ['Lip Sync'] },
]);

export async function generateWithPika(req: GenerationRequest): Promise<GenerationResult> {
  try {
    const image = pickImageInput(req.refs);
    const body: Record<string, unknown> = {
      promptText: req.prompt,
      aspectRatio: req.aspectRatio,
      model: req.modelId || 'pika-2.2',
    };
    if (image) body.image = resolveRefUrl(image);

    const createRes = await fetch(`${PIKA_API}/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => createRes.statusText);
      return { status: 'error', error: mapHttpError(createRes.status, text || 'Pika generation failed') };
    }

    const created = (await createRes.json()) as { id?: string; videoUrl?: string; status?: string };
    if (created.videoUrl) {
      return {
        status: 'complete',
        videoUrl: created.videoUrl,
        posterUrl: image ? resolveRefUrl(image) : undefined,
        providerJobId: created.id,
      };
    }

    const jobId = created.id;
    if (!jobId) return { status: 'error', error: 'Pika did not return a job id' };

    let polls = 0;
    while (polls < MAX_POLLS) {
      await sleep(POLL_INTERVAL_MS);
      const statusRes = await fetch(`${PIKA_API}/videos/${jobId}`, {
        headers: { Authorization: `Bearer ${req.apiKey}` },
      });
      if (!statusRes.ok) {
        const text = await statusRes.text().catch(() => statusRes.statusText);
        return { status: 'error', error: mapHttpError(statusRes.status, text), providerJobId: jobId };
      }
      const status = (await statusRes.json()) as { status?: string; videoUrl?: string };
      if (status.status === 'failed') {
        return { status: 'error', error: 'Pika generation failed', providerJobId: jobId };
      }
      if (status.videoUrl) {
        return {
          status: 'complete',
          videoUrl: status.videoUrl,
          posterUrl: image ? resolveRefUrl(image) : undefined,
          providerJobId: jobId,
        };
      }
      polls++;
    }

    return { status: 'error', error: 'Pika generation timed out', providerJobId: jobId };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Pika generation failed' };
  }
}

export async function testPika(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${PIKA_API}/videos`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: mapHttpError(res.status, 'Invalid Pika API key'), latencyMs };
    }

    if (!res.ok && res.status !== 404 && res.status !== 405) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'Pika connection failed'), latencyMs };
    }

    const modalities = unionModalities(PIKA_MODELS);
    return {
      ok: true,
      message: `Pika API key verified — ${PIKA_MODELS.length} models available`,
      models: PIKA_MODELS,
      modalities,
      purposes: ['Text-to-Video', 'Image-to-Video', 'Lip Sync', 'Effects'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Pika' };
  }
}