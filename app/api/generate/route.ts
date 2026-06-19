import { NextResponse } from 'next/server';
import { runGeneration } from '@/lib/studio/generation/run';
import type { GenerationRequest } from '@/lib/studio/generation/types';
import { resolveProviderApiKey } from '@/lib/storage/server-provider-keys.server';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerationRequest;

    const apiKey = resolveProviderApiKey(body.providerId, body.apiKey);
    if (!apiKey) {
      return NextResponse.json({ status: 'error', error: 'API key is required' }, { status: 400 });
    }
    if (!body.prompt?.trim()) {
      return NextResponse.json({ status: 'error', error: 'Prompt is required' }, { status: 400 });
    }

    const result = await runGeneration({ ...body, apiKey });
    return NextResponse.json(result, { status: result.status === 'error' ? 422 : 200 });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', error: e instanceof Error ? e.message : 'Generation failed' },
      { status: 500 },
    );
  }
}