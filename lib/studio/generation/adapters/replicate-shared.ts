import type Replicate from 'replicate';
import {
  MAX_POLLS,
  POLL_INTERVAL_MS,
  sleep,
} from '@/lib/studio/generation/adapters/shared';
import type { GenerationProgressReporter } from '@/lib/studio/generation/progress';

function resolveModelIdentifier(modelId: string): string {
  if (modelId.includes('/')) return modelId;
  throw new Error(`Replicate model id must be owner/name format (got "${modelId}")`);
}

function extractOutputUrl(output: unknown): string | null {
  if (typeof output === 'string' && output.length > 0) return output;
  if (Array.isArray(output)) {
    const first = output[0];
    if (typeof first === 'string' && first.length > 0) return first;
  }
  return null;
}

export async function runReplicatePrediction(
  client: Replicate,
  modelId: string,
  input: Record<string, unknown>,
  report?: GenerationProgressReporter,
  labels?: { submit?: string; poll?: (status: string, poll: number, id: string) => { message: string; detail?: string } },
): Promise<{ output: unknown; id: string }> {
  const model = resolveModelIdentifier(modelId);
  report?.({
    message: labels?.submit ?? 'Submitting to Replicate',
    detail: `POST /v1/models/${model}/predictions`,
  });

  const prediction = await client.predictions.create({ model, input });
  let result = prediction;
  let polls = 0;

  while (
    result.status !== 'succeeded' &&
    result.status !== 'failed' &&
    result.status !== 'canceled' &&
    polls < MAX_POLLS
  ) {
    await sleep(POLL_INTERVAL_MS);
    result = await client.predictions.get(prediction.id);
    polls++;
    const progress = labels?.poll?.(result.status ?? 'processing', polls, prediction.id);
    report?.(
      progress ?? {
        message: `Replicate ${result.status ?? 'processing'}`,
        detail: `Poll ${polls}/${MAX_POLLS} · job ${prediction.id}`,
      },
    );
  }

  if (result.status === 'failed' || result.status === 'canceled') {
    throw new Error(result.error?.toString() || `Generation ${result.status}`);
  }

  return { output: result.output, id: prediction.id };
}

export function replicateOutputUrl(output: unknown, jobId: string, kind: 'video' | 'image'): string {
  const url = extractOutputUrl(output);
  if (!url) {
    throw new Error(`No ${kind} URL in Replicate response`);
  }
  return url;
}

export async function testReplicateAccount(client: Replicate): Promise<void> {
  await client.accounts.current();
}

export async function searchReplicateVideoModels(client: Replicate) {
  const page = await client.models.search('video');
  return page.results ?? [];
}
