import { NextResponse } from 'next/server';
import { runPreviewFrameGeneration } from '@/lib/studio/generation/adapters/preview-frame';
import type { PreviewFrameRequest } from '@/lib/studio/generation/preview-frame-types';

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PreviewFrameRequest;

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ status: 'error', error: 'API key is required' }, { status: 400 });
    }
    if (!body.prompt?.trim()) {
      return NextResponse.json({ status: 'error', error: 'Prompt is required' }, { status: 400 });
    }

    const result = await runPreviewFrameGeneration(body);
    return NextResponse.json(result, { status: result.status === 'error' ? 422 : 200 });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', error: e instanceof Error ? e.message : 'Preview frame generation failed' },
      { status: 500 },
    );
  }
}