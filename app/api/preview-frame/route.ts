import { NextResponse } from 'next/server';
import { runPreviewFrameGeneration } from '@/lib/studio/generation/adapters/preview-frame';
import { noopProgressReporter } from '@/lib/studio/generation/progress';
import {
  createNdjsonProgressStreamResponse,
  wantsProgressStream,
} from '@/lib/studio/generation/progress-stream.server';
import type { PreviewFrameRequest } from '@/lib/studio/generation/preview-frame-types';
import { resolveProviderApiKey } from '@/lib/storage/server-provider-keys.server';

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PreviewFrameRequest & { streamProgress?: boolean };

    const apiKey = resolveProviderApiKey(body.providerId, body.apiKey);
    if (!apiKey) {
      return NextResponse.json({ status: 'error', error: 'API key is required' }, { status: 400 });
    }
    if (!body.prompt?.trim()) {
      return NextResponse.json({ status: 'error', error: 'Prompt is required' }, { status: 400 });
    }

    const run = (onProgress: NonNullable<PreviewFrameRequest['onProgress']>) =>
      runPreviewFrameGeneration({ ...body, apiKey, onProgress });

    if (wantsProgressStream(body)) {
      return createNdjsonProgressStreamResponse(
        run,
        (result) => result.status === 'error',
      );
    }

    const result = await run(noopProgressReporter());
    return NextResponse.json(result, { status: result.status === 'error' ? 422 : 200 });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', error: e instanceof Error ? e.message : 'Preview frame generation failed' },
      { status: 500 },
    );
  }
}