import { hasGenerationAdapter, listGenerationProviderIds } from '@/lib/studio/generation/capabilities';

export function isGenerationSupported(providerId: string, isCustom: boolean): boolean {
  return hasGenerationAdapter(providerId, isCustom);
}

export function getSupportedGenerationProviderIds(): string[] {
  return listGenerationProviderIds();
}