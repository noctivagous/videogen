import { LEGACY_MODEL_ALIASES } from '@/lib/constants/provider-models';

/** grok-imagine-video-1.5 and aliases — image-to-video only (no text-to-video or reference-to-video). */
const XAI_IMAGE_TO_VIDEO_ONLY = /^grok-imagine-video-1\.5(?:$|[-/])/;

export function normalizeXAIVideoModelId(modelId: string): string {
  return LEGACY_MODEL_ALIASES[modelId] ?? modelId;
}

export function isXAIImageToVideoOnlyModel(modelId: string | undefined): boolean {
  if (!modelId) return false;
  return XAI_IMAGE_TO_VIDEO_ONLY.test(normalizeXAIVideoModelId(modelId));
}

/** True when only reference slot 0 (Image 1) may be used for video generation. */
export function restrictsReferenceSlotsToFirst(
  providerId: string,
  modelId: string | undefined,
): boolean {
  return providerId === 'xai' && isXAIImageToVideoOnlyModel(modelId);
}

export function filterRefsForImageToVideoOnly<
  T extends { url: string; slotIndex?: number; role?: string },
>(refs: T[]): T[] {
  const slotZero = refs.filter((r) => r.slotIndex === 0);
  if (slotZero.length > 0) return slotZero;
  return refs.filter((r) => r.role === 'Backdrop');
}