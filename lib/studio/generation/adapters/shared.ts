import type { Modality, ProviderModel } from '@/lib/types/studio';
import { inferModalitiesFromModelId } from '@/lib/studio/provider-modalities';

export const POLL_INTERVAL_MS = 2000;
export const MAX_POLLS = 90;

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export function parseResolution(resolution: string): { width: number; height: number } {
  const [w, h] = resolution.split('x').map((v) => parseInt(v, 10));
  return { width: w || 1280, height: h || 720 };
}

export function lumaResolution(resolution: string): string {
  const { height } = parseResolution(resolution);
  if (height >= 2160) return '4k';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  return '540p';
}

export function mapHttpError(status: number, fallback: string): string {
  if (status === 401 || status === 403) return 'Invalid API key or insufficient permissions';
  if (status === 404) return 'Endpoint not found — verify base URL or provider access';
  if (status === 429) return 'Rate limited — key works but try again shortly';
  if (status >= 500) return 'Provider service unavailable — try again later';
  return fallback;
}

export async function timedFetch(
  url: string,
  init?: RequestInit,
): Promise<{ res: Response; latencyMs: number }> {
  const start = Date.now();
  const res = await fetch(url, init);
  return { res, latencyMs: Date.now() - start };
}

export function buildModels(
  entries: Array<{ id: string; name?: string; purposes?: string[] }>,
  defaultModalities?: Modality[],
): ProviderModel[] {
  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name ?? entry.id,
    modalities: inferModalitiesFromModelId(entry.id).length > 0
      ? inferModalitiesFromModelId(entry.id)
      : defaultModalities ?? ['video'],
    purposes: entry.purposes,
  }));
}

export function unionFromModels(models: ProviderModel[]): Modality[] {
  const set = new Set<Modality>();
  models.forEach((m) => m.modalities.forEach((mod) => set.add(mod)));
  return ['video', 'image', 'llm', 'tts'].filter((m): m is Modality => set.has(m as Modality));
}