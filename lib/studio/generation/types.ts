export interface GenerationRef {
  role: string;
  url: string;
}

export interface GenerationRequest {
  providerId: string;
  isCustom: boolean;
  apiKey: string;
  customBaseUrl?: string;
  prompt: string;
  duration: number;
  fps: number;
  resolution: string;
  aspectRatio: string;
  refs: GenerationRef[];
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
}