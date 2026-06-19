import type { Modality, ProviderModel } from '@/lib/types/studio';

export interface GenerationRef {
  role: string;
  url: string;
  /** 0-based reference slot; used by xAI image-to-video-only models. */
  slotIndex?: number;
}

export interface GenerationRequest {
  providerId: string;
  isCustom: boolean;
  apiKey: string;
  customBaseUrl?: string;
  /** Provider-specific model id from catalog or connection test */
  modelId?: string;
  prompt: string;
  duration: number;
  fps: number;
  resolution: string;
  aspectRatio: string;
  refs: GenerationRef[];
  /** When false, skip role-based xAI reference prefix (generic image slots). */
  cinematographyRefs?: boolean;
}

export interface GenerationResult {
  status: 'complete' | 'error';
  videoUrl?: string;
  posterUrl?: string;
  error?: string;
  providerJobId?: string;
}

export interface ProviderTestRequest {
  providerId: string;
  isCustom: boolean;
  apiKey: string;
  customBaseUrl?: string;
}

export interface ProviderTestResult {
  ok: boolean;
  message: string;
  models?: ProviderModel[];
  modalities?: Modality[];
  purposes?: string[];
  latencyMs?: number;
}