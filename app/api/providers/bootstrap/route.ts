import { NextResponse } from 'next/server';
import { getServerConfiguredProviderIds } from '@/lib/storage/server-provider-keys.server';

export async function GET() {
  return NextResponse.json({ serverProviders: getServerConfiguredProviderIds() });
}