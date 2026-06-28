import { pickImageInput, resolveRefUrl } from '@/lib/studio/generation/adapters/refs.server';
import {
  replicateOutputUrl,
  runReplicatePrediction,
  searchReplicateVideoModels,
  testReplicateAccount,
} from '@/lib/studio/generation/adapters/replicate-shared';
import {
  NO_MODEL_SELECTED_ERROR,
  requireModelId,
} from '@/lib/studio/generation/adapters/shared';
import { createReplicateClient } from '@/lib/studio/generation/clients/replicate.client';
import { wrapProgressReporter } from '@/lib/studio/generation/progress';
import type { GenerationRequest, GenerationResult } from '@/lib/studio/generation/types';

export async function generateWithReplicate(req: GenerationRequest): Promise<GenerationResult> {
  const report = wrapProgressReporter(req.onProgress);
  const modelId = requireModelId(req.modelId);
  if (!modelId) {
    return { status: 'error', error: NO_MODEL_SELECTED_ERROR };
  }

  try {
    const client = createReplicateClient(req.apiKey);
    const image = pickImageInput(req.refs);
    const input: Record<string, unknown> = {
      prompt: req.prompt,
      prompt_optimizer: true,
    };
    if (image) {
      input.first_frame_image = resolveRefUrl(image);
    }

    const { output, id } = await runReplicatePrediction(client, modelId, input, report);
    const videoUrl = replicateOutputUrl(output, id, 'video');

    return {
      status: 'complete',
      videoUrl,
      posterUrl: image ? resolveRefUrl(image) : undefined,
      providerJobId: id,
    };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Replicate generation failed' };
  }
}

export async function testReplicate(apiKey: string) {
  const start = Date.now();
  try {
    const client = createReplicateClient(apiKey);
    await testReplicateAccount(client);

    let models: Array<{ id: string; name: string; modalities: Array<'video' | 'image' | 'llm' | 'tts'> }> = [];
    try {
      const results = await searchReplicateVideoModels(client);
      models = results
        .slice(0, 12)
        .map((m) => ({
          id: `${m.owner}/${m.name}`,
          name: m.name,
          modalities: /video|animate|motion|hailuo|minimax|luma|kling/i.test(`${m.owner}/${m.name}`)
            ? (['video'] as const)
            : (['image'] as const),
        }));
    } catch {
      // Model search is optional for verification.
    }

    const modalities = [...new Set(models.flatMap((m) => m.modalities))] as Array<'video' | 'image' | 'llm' | 'tts'>;

    if (models.length === 0) {
      return {
        ok: true,
        message: 'Replicate API key verified — no video/image models returned from search',
        models: [],
        modalities: [],
        purposes: ['Community Models', 'Open Weights'],
        latencyMs: Date.now() - start,
      };
    }

    return {
      ok: true,
      message: `Replicate API key verified — ${models.length} model${models.length === 1 ? '' : 's'} found`,
      models,
      modalities,
      purposes: ['Community Models', 'Open Weights'],
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Connection failed',
      latencyMs: Date.now() - start,
    };
  }
}
