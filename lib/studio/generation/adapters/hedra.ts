import { mapHttpError, timedFetch } from '@/lib/studio/generation/adapters/shared';
import type { ProviderTestResult } from '@/lib/studio/generation/types';
import { inferModalitiesFromModelId, unionModalities } from '@/lib/studio/provider-modalities';
import type { ProviderModel } from '@/lib/types/studio';

const HEDRA_API = 'https://api.hedra.com/web-app/public';

function hedraHeaders(apiKey: string): HeadersInit {
  return { 'X-API-Key': apiKey };
}

function hedraModelTypeToModalities(type?: string): ProviderModel['modalities'] {
  if (type === 'video') return ['video'];
  if (type === 'image') return ['image'];
  if (type === 'audio' || type === 'voice') return ['tts'];
  return inferModalitiesFromModelId(type ?? '');
}

export async function testHedra(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${HEDRA_API}/models`, {
      headers: hedraHeaders(apiKey),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'Hedra connection failed'), latencyMs };
    }

    const data = (await res.json()) as Array<{ id?: string; name?: string; type?: string }> | { models?: Array<{ id?: string; name?: string; type?: string }> };
    const raw = Array.isArray(data) ? data : data.models ?? [];
    const models: ProviderModel[] = raw
      .filter((entry) => entry.id)
      .map((entry) => ({
        id: entry.id!,
        name: entry.name ?? entry.id!,
        modalities: hedraModelTypeToModalities(entry.type),
        purposes: entry.type ? [entry.type] : undefined,
      }))
      .filter((model) => model.modalities.length > 0);

    const catalog = models.slice(0, 24);
    const videoCount = catalog.filter((m) => m.modalities.includes('video')).length;

    return {
      ok: true,
      message: catalog.length > 0
        ? `Hedra API key verified — ${videoCount} video model${videoCount === 1 ? '' : 's'} found (${catalog.length} total)`
        : 'Hedra API key verified',
      models: catalog,
      modalities: catalog.length > 0 ? unionModalities(catalog) : ['video', 'tts'],
      purposes: ['Talking Head', 'Avatar', 'Lip Sync'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Hedra' };
  }
}
