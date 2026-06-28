import type { FalClient } from '@fal-ai/client';
import { extractFalImageUrl, extractFalVideoUrl } from '@/lib/studio/generation/clients/fal.client';
import type { GenerationProgressReporter } from '@/lib/studio/generation/progress';

type FalQueueUpdate = {
  status?: string;
  queue_position?: number;
  position?: number;
};

export async function runFalSubscribe(
  client: FalClient,
  endpointId: string,
  input: Record<string, unknown>,
  report?: GenerationProgressReporter,
  labels?: { submit?: string; poll?: (status: string) => { message: string; detail?: string } },
): Promise<{ data: unknown; requestId: string }> {
  report?.({
    message: labels?.submit ?? 'Submitting to fal.ai',
    detail: endpointId,
  });

  const result = await client.subscribe(endpointId, {
    input,
    onQueueUpdate(update: FalQueueUpdate) {
      const status = update.status ?? 'processing';
      const position = update.queue_position ?? update.position;
      const progress = labels?.poll?.(status);
      report?.(
        progress ?? {
          message: `fal.ai ${status}`,
          detail: position != null ? `Queue position ${position}` : endpointId,
        },
      );
    },
  });

  return { data: result.data, requestId: result.requestId };
}

export function falResultVideoUrl(data: unknown): string {
  const url = extractFalVideoUrl(data);
  if (!url) throw new Error('fal returned no video URL');
  return url;
}

export function falResultImageUrl(data: unknown): string {
  const url = extractFalImageUrl(data);
  if (!url) throw new Error('fal returned no image URL');
  return url;
}
