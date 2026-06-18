const IMAGE_PREVIEW_PROVIDERS = new Set(['xai', 'openai', 'replicate']);

export function isPreviewFrameSupported(providerId: string, isCustom: boolean): boolean {
  if (isCustom) return true;
  return IMAGE_PREVIEW_PROVIDERS.has(providerId);
}