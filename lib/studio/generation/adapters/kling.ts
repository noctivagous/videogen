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

const KLING_API = 'https://api.klingai.com/v1';
const KLING_MODELS = buildModels([
  { id: 'kling-v2', name: 'Kling 2.0', purposes: ['Text-to-Video'] },
  { id: 'kling-v2-master', name: 'Kling 2.0 Master', purposes: ['Text-to-Video', 'Image-to-Video'] },
  { id: 'kling-lip-sync', name: 'Kling Lip Sync', purposes: ['Lip Sync'] },
]);

export async function generateWithKling(req: GenerationRequest): Promise<GenerationResult> {
  try {
    const image = pickImageInput(req.refs);
    const endpoint = image ? '/videos/image2video' : '/videos/text2video';
    const body: Record<string, unknown> = {
      model_name: req.modelId || 'kling-v2',
      prompt: req.prompt,
      aspect_ratio: req.aspectRatio,
      duration: String(Math.min(Math.max(req.duration, 5), 10)),
    };
    if (image) body.image = resolveRefUrl(image);

    const createRes = await fetch(`${KLING_API}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => createRes.statusText);
      return { status: 'error', error: mapHttpError(createRes.status, text || 'Kling generation failed') };
    }

    const created = (await createRes.json()) as { data?: { task_id?: string } };
    const taskId = created.data?.task_id;
    if (!taskId) return { status: 'error', error: 'Kling did not return a task id' };

    let polls = 0;
    while (polls < MAX_POLLS) {
      await sleep(POLL_INTERVAL_MS);
      const statusRes = await fetch(`${KLING_API}/videos/${taskId}`, {
        headers: { Authorization: `Bearer ${req.apiKey}` },
      });
      if (!statusRes.ok) {
        const text = await statusRes.text().catch(() => statusRes.statusText);
        return { status: 'error', error: mapHttpError(statusRes.status, text), providerJobId: taskId };
      }
      const status = (await statusRes.json()) as {
        data?: { task_status?: string; task_result?: { videos?: Array<{ url?: string }> } };
      };
      const taskStatus = status.data?.task_status;
      if (taskStatus === 'failed') {
        return { status: 'error', error: 'Kling generation failed', providerJobId: taskId };
      }
      const videoUrl = status.data?.task_result?.videos?.[0]?.url;
      if (taskStatus === 'succeed' && videoUrl) {
        return {
          status: 'complete',
          videoUrl,
          posterUrl: image ? resolveRefUrl(image) : undefined,
          providerJobId: taskId,
        };
      }
      polls++;
    }

    return { status: 'error', error: 'Kling generation timed out', providerJobId: taskId };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Kling generation failed' };
  }
}

export async function testKling(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${KLING_API}/videos/text2video`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: mapHttpError(res.status, 'Invalid Kling API key'), latencyMs };
    }

    if (!res.ok && res.status !== 400 && res.status !== 422) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'Kling connection failed'), latencyMs };
    }

    const modalities = unionModalities(KLING_MODELS);
    return {
      ok: true,
      message: `Kling API key verified — ${KLING_MODELS.length} models available`,
      models: KLING_MODELS,
      modalities,
      purposes: ['Text-to-Video', 'Image-to-Video', 'Lip Sync'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Kling' };
  }
}