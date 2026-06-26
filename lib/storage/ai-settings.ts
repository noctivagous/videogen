import {
  BUILT_IN_PROVIDERS,
  getDefaultEnabledProviderId,
  isBuiltInProviderEnabled,
} from '@/lib/constants/providers';
import { DEFAULT_MODEL_SLOTS } from '@/lib/constants/model-catalog';
import type { ProviderTestResult } from '@/lib/studio/generation/types';
import {
  getProviderStatus,
  hasApiKey,
  resolveImageModelSelectionForProvider,
  resolveModelSelectionForProvider,
} from '@/lib/studio/provider-modalities';
import type { AIState, CustomProvider } from '@/lib/types/studio';

/** Browser storage for provider discovery; keys may also be server-managed via env. */
const STORAGE_KEY = 'vgen_ai_settings';

const DEFAULT_ENABLED_PROVIDER = getDefaultEnabledProviderId();

export const DEFAULT_AI_STATE: AIState = {
  configured: {},
  customProviders: [],
  defaultVideoProvider: DEFAULT_ENABLED_PROVIDER,
  defaultImageProvider: DEFAULT_ENABLED_PROVIDER,
  modelSlots: { ...DEFAULT_MODEL_SLOTS },
};

function isKnownBuiltInProvider(providerId: string): boolean {
  return BUILT_IN_PROVIDERS.some((p) => p.id === providerId);
}

/** Built-in defaults must be enabled; unknown ids (custom) pass through. */
function coerceDefaultProvider(providerId: string | undefined): string {
  const fallback = DEFAULT_ENABLED_PROVIDER;
  if (!providerId) return fallback;
  if (!isKnownBuiltInProvider(providerId)) return providerId;
  return isBuiltInProviderEnabled(providerId) ? providerId : fallback;
}

function migrateAIState(data: Partial<AIState> & { defaultProvider?: string; defaultModelId?: string }): AIState {
  const legacyProvider = data.defaultProvider;
  const legacyModelId = data.defaultModelId;
  const customProviders = data.customProviders || [];

  const rawVideo = data.defaultVideoProvider ?? legacyProvider ?? DEFAULT_ENABLED_PROVIDER;
  const rawImage = data.defaultImageProvider ?? legacyProvider ?? DEFAULT_ENABLED_PROVIDER;

  return {
    configured: data.configured || {},
    customProviders,
    defaultVideoProvider: coerceDefaultProvider(rawVideo),
    defaultVideoModelId: data.defaultVideoModelId ?? legacyModelId,
    defaultImageProvider: coerceDefaultProvider(rawImage),
    defaultImageModelId: data.defaultImageModelId,
    modelSlots: {
      ...DEFAULT_MODEL_SLOTS,
      ...(data.modelSlots ?? {}),
    },
  };
}

export function loadAIState(): AIState {
  if (typeof window === 'undefined') return { ...DEFAULT_AI_STATE };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return migrateAIState(JSON.parse(saved) as Partial<AIState> & { defaultProvider?: string; defaultModelId?: string });
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_AI_STATE };
}

export function saveAIState(state: AIState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function isCustomProvider(providerId: string, ai: AIState): boolean {
  return ai.customProviders.some((p) => p.id === providerId);
}

export function getProviderName(providerId: string, ai: AIState): string {
  const prov = BUILT_IN_PROVIDERS.find((p) => p.id === providerId);
  if (prov) return prov.name;
  const custom = ai.customProviders.find((p) => p.id === providerId);
  return custom?.name ?? providerId;
}

export function getVideoProviderName(ai: AIState): string {
  return getProviderName(ai.defaultVideoProvider, ai);
}

export function getImageProviderName(ai: AIState): string {
  return getProviderName(ai.defaultImageProvider, ai);
}

/** @deprecated Use getVideoProviderName */
export function getCurrentProviderName(ai: AIState): string {
  return getVideoProviderName(ai);
}

export function isServerManagedProvider(
  id: string,
  isCustom: boolean,
  ai: AIState,
): boolean {
  if (isCustom) return false;
  return ai.configured[id]?.serverManaged === true;
}

export function isProviderConnected(
  id: string,
  isCustom: boolean,
  ai: AIState,
): boolean {
  return hasApiKey(id, isCustom, ai);
}

export function mergeServerProviderBootstrap(
  ai: AIState,
  serverProviders: string[],
): AIState {
  if (serverProviders.length === 0) return ai;

  const configured = { ...ai.configured };
  for (const id of serverProviders) {
    const existing = configured[id] ?? { apiKey: '', connected: false };
    configured[id] = {
      ...existing,
      serverManaged: true,
      connected: true,
    };
  }

  return { ...ai, configured };
}

export async function fetchServerProviderBootstrap(): Promise<string[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/providers/bootstrap', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as { serverProviders?: string[] };
    return Array.isArray(data.serverProviders) ? data.serverProviders : [];
  } catch {
    return [];
  }
}

export function isProviderVerified(
  id: string,
  isCustom: boolean,
  ai: AIState,
): boolean {
  return getProviderStatus(id, isCustom, ai) === 'verified';
}

export function getProviderApiKey(
  id: string,
  isCustom: boolean,
  ai: AIState,
): string {
  if (isCustom) {
    return ai.customProviders.find((p) => p.id === id)?.apiKey || '';
  }
  return ai.configured[id]?.apiKey || '';
}

export function applyProviderTestResultToState(
  ai: AIState,
  id: string,
  isCustom: boolean,
  result: ProviderTestResult,
  apiKey?: string,
): AIState {
  const next = { ...ai, configured: { ...ai.configured }, customProviders: [...ai.customProviders] };
  const patch = {
    lastTested: Date.now(),
    lastTestOk: result.ok,
    lastTestMessage: result.message,
    models: result.models,
    modalities: result.modalities,
    purposes: result.purposes,
  };

  if (isCustom) {
    next.customProviders = next.customProviders.map((p) =>
      p.id === id
        ? {
            ...p,
            ...patch,
            apiKey: apiKey?.trim() || p.apiKey,
            connected: result.ok || !!(apiKey?.trim() || (p.apiKey && p.apiKey.length > 4)),
          }
        : p,
    );
  } else {
    const existing = next.configured[id] ?? { apiKey: '', connected: false };
    const resolvedKey = apiKey?.trim() || existing.apiKey;
    next.configured[id] = {
      ...existing,
      ...patch,
      apiKey: resolvedKey,
      connected:
        result.ok
        || !!(resolvedKey && resolvedKey.length > 4)
        || existing.serverManaged === true,
    };
  }

  if (next.defaultVideoProvider === id) {
    next.defaultVideoModelId = resolveModelSelectionForProvider(
      id,
      isCustom,
      next,
      next.defaultVideoModelId,
    );
  }
  if (next.defaultImageProvider === id) {
    next.defaultImageModelId = resolveImageModelSelectionForProvider(
      id,
      isCustom,
      next,
      next.defaultImageModelId,
    );
  }

  return next;
}

export async function bootstrapAIState(): Promise<AIState> {
  let ai = loadAIState();
  const serverProviders = await fetchServerProviderBootstrap();
  ai = mergeServerProviderBootstrap(ai, serverProviders);

  for (const id of serverProviders) {
    const conf = ai.configured[id];
    if (conf?.lastTestOk === true) continue;

    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: id, isCustom: false, apiKey: '' }),
      });
      const result = (await res.json()) as ProviderTestResult;
      ai = applyProviderTestResultToState(ai, id, false, result);
    } catch {
      // Leave as server-managed but unverified; user can re-test in Settings.
    }
  }

  saveAIState(ai);
  return ai;
}

export function createCustomProvider(name: string, baseUrl: string): CustomProvider {
  return {
    id: `custom_${Date.now().toString(36)}`,
    name,
    desc: 'Custom video provider',
    baseUrl,
    apiKey: '',
    connected: false,
  };
}