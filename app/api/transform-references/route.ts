import { NextResponse } from 'next/server';
import { runTransformReferenceGeneration } from '@/lib/studio/generation/transform-reference';
import type { TransformReferenceRequest } from '@/lib/studio/generation/transform-reference-types';
import { resolveProviderApiKey } from '@/lib/storage/server-provider-keys.server';

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TransformReferenceRequest;
    const apiKey = resolveProviderApiKey(body.providerId, body.apiKey);
    if (!apiKey) {
      return NextResponse.json({ status: 'error', error: 'API key is required' }, { status: 400 });
    }
    if (!body.slot?.sourceUrl?.trim()) {
      return NextResponse.json({ status: 'error', error: 'Source reference image is required' }, { status: 400 });
    }

    const result = await runTransformReferenceGeneration({ ...body, apiKey });
    return NextResponse.json(result, { status: result.status === 'error' ? 422 : 200 });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', error: e instanceof Error ? e.message : 'Transform failed' },
      { status: 500 },
    );
  }
}