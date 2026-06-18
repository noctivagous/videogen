import {
  BUILT_IN_PROVIDERS,
  getDefaultEnabledProviderId,
  isBuiltInProviderEnabled,
} from '@/lib/constants/providers';
import { getProviderStatus, hasApiKey } from '@/lib/studio/provider-modalities';
import type { AIState, CustomProvider } from '@/lib/types/studio';

/** Browser-only storage — API keys never belong in git or project JSON files. */
const STORAGE_KEY = 'vgen_ai_settings';

const DEFAULT_ENABLED_PROVIDER = getDefaultEnabledProviderId();

export const DEFAULT_AI_STATE: AIState = {
  configured: {},
  customProviders: [],
  defaultVideoProvider: DEFAULT_ENABLED_PROVIDER,
  defaultImageProvider: DEFAULT_ENABLED_PROVIDER,
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

export function isProviderConnected(
  id: string,
  isCustom: boolean,
  ai: AIState,
): boolean {
  return hasApiKey(id, isCustom, ai);
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