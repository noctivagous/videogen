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
}

export interface PreviewFrameResult {
  status: 'complete' | 'error';
  imageUrl?: string;
  error?: string;
}