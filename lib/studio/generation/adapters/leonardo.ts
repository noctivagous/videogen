import { buildModels, mapHttpError, timedFetch } from '@/lib/studio/generation/adapters/shared';
import type { ProviderTestResult } from '@/lib/studio/generation/types';
import { unionModalities } from '@/lib/studio/provider-modalities';

const LEONARDO_API = 'https://cloud.leonardo.ai/api/rest/v1';

const LEONARDO_MODELS = buildModels([
  { id: 'motion-2.0', name: 'Motion 2.0', purposes: ['Image-to-Video'] },
  { id: 'phoenix', name: 'Phoenix', purposes: ['Text-to-Image'] },
  { id: 'lucid-origin', name: 'Lucid Origin', purposes: ['Text-to-Image'] },
]);

export async function testLeonardo(apiKey: string): Promise<ProviderTestResult> {
  try {
    const { res, latencyMs } = await timedFetch(`${LEONARDO_API}/me`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return { ok: false, message: mapHttpError(res.status, text || 'Leonardo connection failed'), latencyMs };
    }

    const profile = (await res.json()) as {
      user_details?: Array<{ user?: { username?: string } }>;
      userSubscriptions?: Array<{ tokens?: number }>;
    };
    const username = profile.user_details?.[0]?.user?.username ?? 'your account';

    return {
      ok: true,
      message: `Leonardo API key verified for ${username} — ${LEONARDO_MODELS.length} models cataloged`,
      models: LEONARDO_MODELS,
      modalities: unionModalities(LEONARDO_MODELS),
      purposes: ['Image-to-Video', 'Character Animation'],
      latencyMs,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not reach Leonardo.AI' };
  }
}
