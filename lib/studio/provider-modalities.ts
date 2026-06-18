import { LEGACY_MODEL_ALIASES } from '@/lib/constants/provider-models';
import { BUILT_IN_PROVIDERS } from '@/lib/constants/providers';
import type {
  AIState,
  BuiltInProvider,
  CustomProvider,
  Modality,
  ProviderDiscovery,
  ProviderModel,
  ProviderStatus,
} from '@/lib/types/studio';

export const MODALITY_ORDER: Modality[] = ['video', 'image', 'llm', 'tts'];

export const MODALITY_CONFIG: Record<
  Modality,
  { label: string; chipClass: string }
> = {
  video: { label: 'Video', chipClass: 'modality-chip--video' },
  image: { label: 'Image', chipClass: 'modality-chip--image' },
  llm: { label: 'LLM', chipClass: 'modality-chip--llm' },
  tts: { label: 'TTS', chipClass: 'modality-chip--tts' },
};

const MODEL_MODALITY_RULES: Array<{ test: RegExp; modalities: Modality[] }> = [
  { test: /grok-imagine-video|imagine-video/i, modalities: ['video'] },
  { test: /grok-imagine-image|imagine-image/i, modalities: ['image'] },
  { test: /sora|video-01|gen-?3|dream-machine|kling|pika|stable-video|hailuo|runway|luma/i, modalities: ['video'] },
  { test: /dall-e|gpt-image|flux|sdxl|stable-diffusion|leonardo/i, modalities: ['image'] },
  { test: /^tts-|eleven|speech/i, modalities: ['tts'] },
  { test: /^whisper|stt/i, modalities: ['tts'] },
  // Chat Grok only — exclude grok-imagine-* (handled by rules above).
  { test: /^grok(?!-imagine)/i, modalities: ['llm'] },
  { test: /^gpt-|claude|llama|mistral|gemini/i, modalities: ['llm'] },
  { test: /gpt-4o|gpt-4-turbo|vision/i, modalities: ['llm', 'image'] },
];

function hydrateProviderModel(model: ProviderModel): ProviderModel {
  return {
    ...model,
    modalities: inferModalitiesFromModelId(model.id),
  };
}

export function inferModalitiesFromModelId(id: string): Modality[] {
  const normalized = id.toLowerCase();
  const found = new Set<Modality>();
  for (const rule of MODEL_MODALITY_RULES) {
    if (rule.test.test(normalized)) {
      rule.modalities.forEach((m) => found.add(m));
    }
  }
  if (found.size === 0 && /video|animate|motion/i.test(normalized)) found.add('video');
  if (found.size === 0 && /image|diffusion|paint/i.test(normalized)) found.add('image');
  return MODALITY_ORDER.filter((m) => found.has(m));
}

export function unionModalities(models: ProviderModel[]): Modality[] {
  const found = new Set<Modality>();
  models.forEach((m) => m.modalities.forEach((mod) => found.add(mod)));
  return MODALITY_ORDER.filter((m) => found.has(m));
}

export function unionPurposes(...groups: (string[] | undefined)[]): string[] {
  const found = new Set<string>();
  groups.forEach((group) => group?.forEach((p) => found.add(p)));
  return [...found];
}

export function getBuiltInProvider(id: string): BuiltInProvider | undefined {
  return BUILT_IN_PROVIDERS.find((p) => p.id === id);
}

export function getProviderDiscovery(
  id: string,
  isCustom: boolean,
  ai: AIState,
): ProviderDiscovery | undefined {
  if (isCustom) return ai.customProviders.find((p) => p.id === id);
  return ai.configured[id];
}

export function hasApiKey(id: string, isCustom: boolean, ai: AIState): boolean {
  if (isCustom) {
    const prov = ai.customProviders.find((p) => p.id === id);
    return !!(prov?.apiKey && prov.apiKey.length > 4);
  }
  const conf = ai.configured[id];
  return !!(conf?.apiKey && conf.apiKey.length > 4);
}

export function getProviderStatus(
  id: string,
  isCustom: boolean,
  ai: AIState,
): ProviderStatus {
  if (!hasApiKey(id, isCustom, ai)) return 'not_configured';
  const discovery = getProviderDiscovery(id, isCustom, ai);
  if (discovery?.lastTestOk === true) return 'verified';
  if (discovery?.lastTestOk === false) return 'failed';
  return 'configured';
}

export function mergeProviderCapabilities(
  staticPurposes: string[],
  staticModalities: Modality[],
  discovery?: ProviderDiscovery,
): { purposes: string[]; modalities: Modality[]; models: ProviderModel[] } {
  const models = discovery?.models ?? [];
  const discoveredModalities = discovery?.modalities?.length
    ? discovery.modalities
    : models.length > 0
      ? unionModalities(models)
      : [];

  const modalities = discoveredModalities.length > 0
    ? discoveredModalities
    : staticModalities;

  return {
    purposes: unionPurposes(staticPurposes, discovery?.purposes, models.flatMap((m) => m.purposes ?? [])),
    modalities,
    models,
  };
}

export function getProviderSortScore(
  id: string,
  isCustom: boolean,
  ai: AIState,
): number {
  const status = getProviderStatus(id, isCustom, ai);
  const discovery = getProviderDiscovery(id, isCustom, ai);
  const modelCount = discovery?.models?.length ?? 0;

  if (status === 'verified' && modelCount > 0) return 0;
  if (status === 'verified') return 1;
  if (status === 'configured') return 2;
  if (status === 'failed') return 3;
  return 4;
}

export function sortBuiltInProviders(ai: AIState): BuiltInProvider[] {
  return [...BUILT_IN_PROVIDERS].sort((a, b) => {
    const scoreDiff = getProviderSortScore(a.id, false, ai) - getProviderSortScore(b.id, false, ai);
    if (scoreDiff !== 0) return scoreDiff;
    return BUILT_IN_PROVIDERS.findIndex((p) => p.id === a.id) - BUILT_IN_PROVIDERS.findIndex((p) => p.id === b.id);
  });
}

export function sortCustomProviders(ai: AIState): CustomProvider[] {
  return [...ai.customProviders].sort((a, b) => {
    const scoreDiff = getProviderSortScore(a.id, true, ai) - getProviderSortScore(b.id, true, ai);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  });
}

/** Models returned by a successful Test connection only — no static catalog fallback. */
function getVerifiedModels(
  id: string,
  isCustom: boolean,
  ai: AIState,
): ProviderModel[] {
  const discovery = getProviderDiscovery(id, isCustom, ai);
  if (discovery?.lastTestOk !== true) return [];
  return (discovery.models ?? []).map(hydrateProviderModel);
}

export function getAvailableVideoModels(
  id: string,
  isCustom: boolean,
  ai: AIState,
): ProviderModel[] {
  return getVerifiedModels(id, isCustom, ai).filter((m) => m.modalities.includes('video'));
}

function normalizeLegacyModelId(modelId?: string): string | undefined {
  if (!modelId) return undefined;
  return LEGACY_MODEL_ALIASES[modelId] ?? modelId;
}

export function getAvailableImageModels(
  id: string,
  isCustom: boolean,
  ai: AIState,
): ProviderModel[] {
  return getVerifiedModels(id, isCustom, ai).filter((m) => m.modalities.includes('image'));
}

export function hasVerifiedVideoModels(id: string, isCustom: boolean, ai: AIState): boolean {
  return getAvailableVideoModels(id, isCustom, ai).length > 0;
}

export function hasVerifiedImageModels(id: string, isCustom: boolean, ai: AIState): boolean {
  return getAvailableImageModels(id, isCustom, ai).length > 0;
}

export function resolveModelSelectionForProvider(
  id: string,
  isCustom: boolean,
  ai: AIState,
  preferredModelId?: string,
): string | undefined {
  const models = getAvailableVideoModels(id, isCustom, ai);
  if (models.length === 0) return undefined;
  const normalized = normalizeLegacyModelId(preferredModelId);
  if (normalized && models.some((m) => m.id === normalized)) return normalized;
  return models[0].id;
}

export function resolveImageModelSelectionForProvider(
  id: string,
  isCustom: boolean,
  ai: AIState,
  preferredModelId?: string,
): string | undefined {
  const models = getAvailableImageModels(id, isCustom, ai);
  if (models.length === 0) return undefined;
  const normalized = normalizeLegacyModelId(preferredModelId);
  if (normalized && models.some((m) => m.id === normalized)) return normalized;
  return models[0].id;
}

export function getEffectiveModelId(ai: AIState): string | undefined {
  const isCustom = ai.customProviders.some((p) => p.id === ai.defaultVideoProvider);
  return resolveModelSelectionForProvider(
    ai.defaultVideoProvider,
    isCustom,
    ai,
    ai.defaultVideoModelId,
  );
}

export function getEffectivePreviewModelId(ai: AIState): string | undefined {
  const isCustom = ai.customProviders.some((p) => p.id === ai.defaultImageProvider);
  return resolveImageModelSelectionForProvider(
    ai.defaultImageProvider,
    isCustom,
    ai,
    ai.defaultImageModelId,
  );
}

export function getModelLabel(modelId: string | undefined, models: ProviderModel[]): string | null {
  if (!modelId) return null;
  const match = models.find((m) => m.id === modelId);
  if (match) return match.name;
  const shortId = modelId.includes('/') ? modelId.split('/').pop() : modelId;
  return shortId ?? modelId;
}

export interface ProviderModelDisplay {
  providerName: string;
  modelLabel: string | null;
}

function getProviderModelDisplay(
  providerId: string,
  ai: AIState,
  models: ProviderModel[],
  modelId: string | undefined,
): ProviderModelDisplay {
  const isCustom = ai.customProviders.some((p) => p.id === providerId);
  const builtIn = getBuiltInProvider(providerId);
  const custom = isCustom ? ai.customProviders.find((p) => p.id === providerId) : null;
  return {
    providerName: custom?.name ?? builtIn?.name ?? providerId,
    modelLabel: getModelLabel(modelId, models),
  };
}

export function getSelectedVideoModelDisplay(ai: AIState): ProviderModelDisplay {
  const isCustom = ai.customProviders.some((p) => p.id === ai.defaultVideoProvider);
  return getProviderModelDisplay(
    ai.defaultVideoProvider,
    ai,
    getAvailableVideoModels(ai.defaultVideoProvider, isCustom, ai),
    getEffectiveModelId(ai),
  );
}

export function getSelectedImageModelDisplay(ai: AIState): ProviderModelDisplay {
  const isCustom = ai.customProviders.some((p) => p.id === ai.defaultImageProvider);
  return getProviderModelDisplay(
    ai.defaultImageProvider,
    ai,
    getAvailableImageModels(ai.defaultImageProvider, isCustom, ai),
    getEffectivePreviewModelId(ai),
  );
}

/** @deprecated Use getSelectedVideoModelDisplay */
export function getSelectedModelDisplay(ai: AIState): ProviderModelDisplay {
  return getSelectedVideoModelDisplay(ai);
}

/** @deprecated Use getEffectiveModelId */
export function pickDefaultVideoModel(
  id: string,
  isCustom: boolean,
  ai: AIState,
): string | undefined {
  return resolveModelSelectionForProvider(id, isCustom, ai);
}

export function formatRelativeTime(timestamp?: number): string | null {
  if (!timestamp) return null;
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}