import { BUILT_IN_PROVIDERS } from '@/lib/constants/providers';
import type { AIState, CustomProvider } from '@/lib/types/studio';

/** Browser-only storage — API keys never belong in git or project JSON files. */
const STORAGE_KEY = 'vgen_ai_settings';

export const DEFAULT_AI_STATE: AIState = {
  configured: {},
  customProviders: [],
  defaultProvider: 'replicate',
};

export function loadAIState(): AIState {
  if (typeof window === 'undefined') return { ...DEFAULT_AI_STATE };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved) as Partial<AIState>;
      return {
        configured: data.configured || {},
        customProviders: data.customProviders || [],
        defaultProvider: data.defaultProvider || 'replicate',
      };
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

export function getCurrentProviderName(ai: AIState): string {
  const prov = BUILT_IN_PROVIDERS.find((p) => p.id === ai.defaultProvider);
  if (prov) return prov.name;
  const custom = ai.customProviders.find((p) => p.id === ai.defaultProvider);
  return custom ? custom.name : 'xAI';
}

export function isProviderConnected(
  id: string,
  isCustom: boolean,
  ai: AIState,
): boolean {
  if (isCustom) {
    const prov = ai.customProviders.find((p) => p.id === id);
    return !!(prov?.apiKey && prov.apiKey.length > 4);
  }
  const conf = ai.configured[id];
  return !!(conf?.apiKey && conf.apiKey.length > 4);
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