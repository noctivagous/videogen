import { NextResponse } from 'next/server';
import { runGeneration } from '@/lib/studio/generation/run';
import type { GenerationRequest } from '@/lib/studio/generation/types';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerationRequest;

    if (!body.apiKey?.trim()) {
      return NextResponse.json({ status: 'error', error: 'API key is required' }, { status: 400 });
    }
    if (!body.prompt?.trim()) {
      return NextResponse.json({ status: 'error', error: 'Prompt is required' }, { status: 400 });
    }

    const result = await runGeneration(body);
    return NextResponse.json(result, { status: result.status === 'error' ? 422 : 200 });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', error: e instanceof Error ? e.message : 'Generation failed' },
      { status: 500 },
    );
  }
}