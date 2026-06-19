import { NextResponse } from 'next/server';
import { testProviderConnection } from '@/lib/studio/generation/run';
import type { ProviderTestRequest } from '@/lib/studio/generation/types';
import { resolveProviderApiKey } from '@/lib/storage/server-provider-keys.server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProviderTestRequest;
    const apiKey = resolveProviderApiKey(body.providerId, body.apiKey);
    if (!apiKey) {
      return NextResponse.json({ ok: false, message: 'API key is required' }, { status: 400 });
    }
    const result = await testProviderConnection({ ...body, apiKey });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Test failed' },
      { status: 500 },
    );
  }
}