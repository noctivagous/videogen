import type { LabDefinition } from '@/lib/types/studio';

const LOGO_BASE = '/service-provider-logos';

/** Lab ids that reuse an existing provider logo file (no direct API provider id). */
const LAB_LOGO_PROVIDER_ALIASES: Record<string, string> = {
  google: 'google',
  elevenlabs: 'elevenlabs',
  pika: 'pika',
};

/** Provider id → logo filename (without path). Omit providers that fall back to emoji. */
const PROVIDER_LOGO_FILES: Record<string, string> = {
  amazon: 'amazon.png',
  'black-forest-labs': 'black-forest-labs.png',
  bytedance: 'bytedance.png',
  anthropic: 'anthropic.png',
  azure: 'azure.png',
  elevenlabs: 'elevenlabs.png',
  fal: 'fal.png',
  fireworks: 'fireworks.png',
  google: 'google.png',
  groq: 'groq.png',
  hedra: 'hedra.png',
  huggingface: 'huggingface.png',
  kling: 'kling.png',
  leonardo: 'leonardo.png',
  luma: 'luma.png',
  meta: 'meta.png',
  midjourney: 'midjourney.png',
  minimax: 'minimax.png',
  openai: 'openai.png',
  openrouter: 'openrouter.png',
  pika: 'pika.png',
  replicate: 'replicate.png',
  runway: 'runway.png',
  stability: 'stability.png',
  suno: 'suno.png',
  together: 'together.png',
  udio: 'udio.png',
  viggle: 'viggle.png',
  wan: 'wan.png',
  xai: 'xai.png',
};

export function getProviderLogoUrl(providerId: string): string | undefined {
  const file = PROVIDER_LOGO_FILES[providerId];
  return file ? `${LOGO_BASE}/${file}` : undefined;
}

export function hasProviderLogo(providerId: string): boolean {
  return providerId in PROVIDER_LOGO_FILES;
}

export function getLabLogoProviderId(
  lab: Pick<LabDefinition, 'id' | 'directProviderId'>,
): string {
  if (lab.directProviderId) return lab.directProviderId;
  return LAB_LOGO_PROVIDER_ALIASES[lab.id] ?? lab.id;
}

export function getLabLogoUrl(
  lab: Pick<LabDefinition, 'id' | 'directProviderId'>,
): string | undefined {
  return getProviderLogoUrl(getLabLogoProviderId(lab));
}

export function hasLabLogo(lab: Pick<LabDefinition, 'id' | 'directProviderId'>): boolean {
  return hasProviderLogo(getLabLogoProviderId(lab));
}
