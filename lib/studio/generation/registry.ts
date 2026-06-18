import { generateWithCustom } from '@/lib/studio/generation/adapters/custom';
import { testHuggingFace } from '@/lib/studio/generation/adapters/huggingface';
import { generateWithKling, testKling } from '@/lib/studio/generation/adapters/kling';
import { generateWithLuma, testLuma } from '@/lib/studio/generation/adapters/luma';
import { generateWithOpenAI, testOpenAI } from '@/lib/studio/generation/adapters/openai';
import { generateWithPika, testPika } from '@/lib/studio/generation/adapters/pika';
import { generateWithReplicate, testReplicate } from '@/lib/studio/generation/adapters/replicate';
import { generateWithRunway, testRunway } from '@/lib/studio/generation/adapters/runway';
import { generateWithStability, testStability } from '@/lib/studio/generation/adapters/stability';
import { generateWithXAI, testXAI } from '@/lib/studio/generation/adapters/xai';
import { NO_MODEL_SELECTED_ERROR, requireModelId } from '@/lib/studio/generation/adapters/shared';
import type { GenerationRequest, GenerationResult, ProviderTestResult } from '@/lib/studio/generation/types';
import { getBuiltInProvider } from '@/lib/studio/provider-modalities';

export type GenerationHandler = (req: GenerationRequest) => Promise<GenerationResult>;
export type TestHandler = (apiKey: string) => Promise<ProviderTestResult>;

const GENERATION_HANDLERS: Record<string, GenerationHandler> = {
  replicate: generateWithReplicate,
  runway: generateWithRunway,
  luma: generateWithLuma,
  kling: generateWithKling,
  pika: generateWithPika,
  stability: generateWithStability,
  xai: generateWithXAI,
  openai: generateWithOpenAI,
};

const TEST_HANDLERS: Record<string, TestHandler> = {
  replicate: testReplicate,
  openai: testOpenAI,
  runway: testRunway,
  luma: testLuma,
  kling: testKling,
  pika: testPika,
  stability: testStability,
  xai: testXAI,
  huggingface: testHuggingFace,
};

export async function runProviderGeneration(req: GenerationRequest): Promise<GenerationResult> {
  if (req.isCustom) return generateWithCustom(req);

  if (!requireModelId(req.modelId)) {
    return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
  }

  const handler = GENERATION_HANDLERS[req.providerId];
  if (handler) return handler(req);

  const builtIn = getBuiltInProvider(req.providerId);
  return {
    status: 'error',
    error: `${builtIn?.name ?? req.providerId} does not have a video generation adapter yet. Choose another default provider in Settings.`,
  };
}

export async function runProviderTest(
  providerId: string,
  isCustom: boolean,
  apiKey: string,
  customBaseUrl?: string,
): Promise<ProviderTestResult> {
  if (isCustom) {
    const { testCustom } = await import('@/lib/studio/generation/adapters/custom');
    if (!customBaseUrl) return { ok: false, message: 'Base URL is required' };
    return testCustom(customBaseUrl, apiKey);
  }

  const handler = TEST_HANDLERS[providerId];
  if (handler) return handler(apiKey);

  const builtIn = getBuiltInProvider(providerId);
  return {
    ok: false,
    message: `Live connection test not available for ${builtIn?.name ?? providerId} yet. Purpose tags are shown from catalog metadata.`,
    purposes: builtIn?.purposes,
    modalities: builtIn?.modalities,
  };
}