/** Server-only provider API keys from environment — never sent to the client. */

const PROVIDER_ENV_KEYS: Record<string, string> = {
  xai: 'XAI_API_KEY',
  openai: 'OPENAI_API_KEY',
  replicate: 'REPLICATE_API_TOKEN',
  fal: 'FAL_KEY',
  together: 'TOGETHER_API_KEY',
  stability: 'STABILITY_API_KEY',
  runway: 'RUNWAY_API_KEY',
};

function readEnvKey(envVar: string): string | null {
  const key = process.env[envVar]?.trim();
  return key && key.length > 4 ? key : null;
}

export function getServerProviderKey(providerId: string): string | null {
  const envVar = PROVIDER_ENV_KEYS[providerId];
  if (!envVar) return null;
  return readEnvKey(envVar);
}

export function getServerConfiguredProviderIds(): string[] {
  return Object.keys(PROVIDER_ENV_KEYS).filter((id) => getServerProviderKey(id) !== null);
}

/** Client key wins when present; otherwise fall back to server env. */
export function resolveProviderApiKey(providerId: string, clientKey?: string): string | null {
  const trimmed = clientKey?.trim();
  if (trimmed) return trimmed;
  return getServerProviderKey(providerId);
}