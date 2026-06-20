import type { GenerationProgressReporter } from '@/lib/studio/generation/progress';
import type { GenerationRef } from '@/lib/studio/generation/types';

export interface PreviewFrameRequest {
  providerId: string;
  isCustom: boolean;
  apiKey: string;
  customBaseUrl?: string;
  modelId?: string;
  prompt: string;
  aspectRatio: string;
  refs: GenerationRef[];
  /** When false, skip role-based reference prefix (generic image slots). */
  cinematographyRefs?: boolean;
  onProgress?: GenerationProgressReporter;
}

export interface PreviewFrameResult {
  status: 'complete' | 'error';
  imageUrl?: string;
  error?: string;
}