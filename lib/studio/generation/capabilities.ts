/** Client-safe generation capability checks — no adapter imports. */
export const GENERATION_PROVIDER_IDS = [
  'replicate',
  'runway',
  'luma',
  'kling',
  'pika',
  'stability',
  'xai',
  'openai',
] as const;

export type GenerationProviderId = (typeof GENERATION_PROVIDER_IDS)[number];

export function hasGenerationAdapter(providerId: string, isCustom: boolean): boolean {
  if (isCustom) return true;
  return (GENERATION_PROVIDER_IDS as readonly string[]).includes(providerId);
}

export function listGenerationProviderIds(): string[] {
  return [...GENERATION_PROVIDER_IDS];
}