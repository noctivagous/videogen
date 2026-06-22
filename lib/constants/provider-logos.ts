const LOGO_BASE = '/service-provider-logos';

/** Provider id → logo filename (without path). Omit providers that fall back to emoji. */
const PROVIDER_LOGO_FILES: Record<string, string> = {
  amazon: 'amazon.png',
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
  xai: 'xai.png',
};

export function getProviderLogoUrl(providerId: string): string | undefined {
  const file = PROVIDER_LOGO_FILES[providerId];
  return file ? `${LOGO_BASE}/${file}` : undefined;
}

export function hasProviderLogo(providerId: string): boolean {
  return providerId in PROVIDER_LOGO_FILES;
}
