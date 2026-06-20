export interface InpaintRequest {
  providerId: string;
  apiKey: string;
  modelId?: string;
  imageUrl: string;
  maskUrl: string;
  prompt: string;
}

export interface InpaintResult {
  status: 'complete' | 'error';
  imageUrl?: string;
  error?: string;
  providerJobId?: string;
}

export interface BakeStartFrameRequest {
  inpaint: InpaintRequest;
  identityPass?: {
    providerId: string;
    isCustom: boolean;
    apiKey: string;
    customBaseUrl?: string;
    modelId?: string;
    prompt: string;
    aspectRatio: string;
    refs: Array<{ role: string; url: string; slotIndex: number }>;
    cinematographyRefs?: boolean;
  };
}

export interface BakeStartFrameResult {
  status: 'complete' | 'error';
  imageUrl?: string;
  error?: string;
}