import { runProviderGeneration, runProviderTest } from '@/lib/studio/generation/registry';
import type { GenerationRequest, GenerationResult, ProviderTestRequest, ProviderTestResult } from '@/lib/studio/generation/types';

export async function runGeneration(req: GenerationRequest): Promise<GenerationResult> {
  return runProviderGeneration(req);
}

export async function testProviderConnection(req: ProviderTestRequest): Promise<ProviderTestResult> {
  return runProviderTest(req.providerId, req.isCustom, req.apiKey, req.customBaseUrl);
}