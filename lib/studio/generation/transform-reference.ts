import { runPreviewFrameGeneration } from '@/lib/studio/generation/adapters/preview-frame';
import type { TransformReferenceRequest, TransformReferenceResult } from '@/lib/studio/generation/transform-reference-types';
import { buildTransformPromptForSlot } from '@/lib/studio/theme-transform';

export async function runTransformReferenceGeneration(
  req: TransformReferenceRequest,
): Promise<TransformReferenceResult> {
  const prompt = buildTransformPromptForSlot(req.slot.role, req.lighting);
  if (!prompt.trim()) {
    return { status: 'error', error: 'Theme Transformer is off — enable Color or Look Library first' };
  }

  const result = await runPreviewFrameGeneration({
    providerId: req.providerId,
    isCustom: req.isCustom,
    apiKey: req.apiKey,
    customBaseUrl: req.customBaseUrl,
    modelId: req.modelId,
    prompt: `Edit this reference image. ${prompt}. No text, typography, or watermarks.`,
    aspectRatio: req.aspectRatio,
    refs: [{ role: req.slot.role, url: req.slot.sourceUrl, slotIndex: req.slot.index }],
    cinematographyRefs: true,
  });

  if (result.status === 'error') {
    return { status: 'error', error: result.error ?? 'Transform failed' };
  }
  return { status: 'complete', imageUrl: result.imageUrl };
}