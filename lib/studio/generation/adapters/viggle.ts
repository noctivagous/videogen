import { buildModels, mapHttpError, timedFetch } from '@/lib/studio/generation/adapters/shared';
import type { ProviderTestResult } from '@/lib/studio/generation/types';
import { unionModalities } from '@/lib/studio/provider-modalities';

const VIGGLE_API = 'https://apis.viggle.ai';

const VIGGLE_MODELS = buildModels([
  { id: 'viggle-mix-motion-v1', name: 'Viggle Mix Motion', purposes: ['Motion Control'] },
  { id: 'viggle-character-swap-v1', name: 'Viggle Character Swap', purposes: ['Character Swap'] },
]);

function viggleHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function testViggle(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${VIGGLE_API}/api/characters?limit=1`, {
      headers: viggleHeaders(apiKey),
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: mapHttpError(res.status, 'Invalid Viggle API key'), latencyMs };
    }

    if (!res.ok && res.status !== 404 && res.status !== 405) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'Viggle connection failed'), latencyMs };
    }

    return {
      ok: true,
      message: `Viggle API key verified — ${VIGGLE_MODELS.length} models cataloged`,
      models: VIGGLE_MODELS,
      modalities: unionModalities(VIGGLE_MODELS),
      purposes: ['Motion Control', 'Character Swap'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Viggle' };
  }
}
