import type { LightingSettings, ReferenceRole } from '@/lib/types/studio';

export interface TransformReferenceRequest {
  providerId: string;
  isCustom: boolean;
  apiKey: string;
  customBaseUrl?: string;
  modelId?: string;
  aspectRatio: string;
  slot: {
    index: number;
    role: ReferenceRole;
    sourceUrl: string;
  };
  lighting: LightingSettings;
}

export interface TransformReferenceResult {
  status: 'complete' | 'error';
  imageUrl?: string;
  error?: string;
}