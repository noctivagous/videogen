export const SUPPORTED_GENERATION_PROVIDERS = new Set(['replicate']);

export function isGenerationSupported(providerId: string, isCustom: boolean): boolean {
  if (isCustom) return true;
  return SUPPORTED_GENERATION_PROVIDERS.has(providerId);
}