import type { GenerationProgressReporter } from '@/lib/studio/generation/progress';
import type { GenerationRef } from '@/lib/studio/generation/types';

export interface InpaintRequest {
  providerId: string;
  apiKey: string;
  modelId?: string;
  /** Source frame — for xAI bake, backdrop with visible mannequin silhouettes. */
  imageUrl: string;
  /** Mask inpainting (Replicate FLUX Fill only). */
  maskUrl?: string;
  prompt: string;
  aspectRatio?: string;
  onProgress?: GenerationProgressReporter;
}

export interface InpaintResult {
  status: 'complete' | 'error';
  imageUrl?: string;
  error?: string;
  providerJobId?: string;
}

export type BakeIdentityPassPayload = {
  providerId: string;
  isCustom: boolean;
  apiKey: string;
  customBaseUrl?: string;
  modelId?: string;
  prompt: string;
  aspectRatio: string;
  refs: GenerationRef[];
  cinematographyRefs?: boolean;
  onProgress?: GenerationProgressReporter;
};

export interface BakeStartFrameRequest {
  inpaint: InpaintRequest;
  /** @deprecated Prefer identityPasses — single pass kept for backward compatibility. */
  identityPass?: BakeIdentityPassPayload;
  identityPasses?: BakeIdentityPassPayload[];
}

export interface BakeStartFrameResult {
  status: 'complete' | 'error';
  imageUrl?: string;
  error?: string;
}