import { generateWithCustom, testCustom } from '@/lib/studio/generation/adapters/custom';
import { generateWithReplicate, testReplicate } from '@/lib/studio/generation/adapters/replicate';
import type { GenerationRequest, GenerationResult, ProviderTestRequest, ProviderTestResult } from '@/lib/studio/generation/types';

export async function runGeneration(req: GenerationRequest): Promise<GenerationResult> {
  if (req.isCustom) return generateWithCustom(req);
  if (req.providerId === 'replicate') return generateWithReplicate(req);
  return {
    status: 'error',
    error: `Provider "${req.providerId}" is not yet supported. Use Replicate or a Custom provider.`,
  };
}

export async function testProviderConnection(req: ProviderTestRequest): Promise<ProviderTestResult> {
  if (req.isCustom) {
    if (!req.customBaseUrl) return { ok: false, message: 'Base URL is required' };
    return testCustom(req.customBaseUrl, req.apiKey);
  }
  if (req.providerId === 'replicate') return testReplicate(req.apiKey);
  return { ok: false, message: 'Live connection test not available for this provider yet' };
}