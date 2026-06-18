import { NextResponse } from 'next/server';
import { testProviderConnection } from '@/lib/studio/generation/run';
import type { ProviderTestRequest } from '@/lib/studio/generation/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProviderTestRequest;
    if (!body.apiKey?.trim()) {
      return NextResponse.json({ ok: false, message: 'API key is required' }, { status: 400 });
    }
    const result = await testProviderConnection(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Test failed' },
      { status: 500 },
    );
  }
}