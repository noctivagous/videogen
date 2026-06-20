import type { GenerationProgressUpdate, NdjsonProgressEvent } from '@/lib/studio/generation/progress';

export class GenerationProgressStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationProgressStreamError';
  }
}

export async function fetchWithGenerationProgress<T extends { status: string }>(
  url: string,
  body: Record<string, unknown>,
  onProgress: (update: GenerationProgressUpdate) => void,
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, streamProgress: true }),
  });

  const contentType = res.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/x-ndjson')) {
    const result = (await res.json()) as T;
    if (!res.ok || result.status === 'error') {
      const err =
        typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Request failed';
      throw new GenerationProgressStreamError(err);
    }
    return result;
  }

  if (!res.body) {
    throw new GenerationProgressStreamError('No response body from progress stream');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: T | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      buffer += decoder.decode(value, { stream: !done });
    }
    if (done) break;

    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) {
        const event = JSON.parse(line) as NdjsonProgressEvent<T>;
        if (event.type === 'progress') {
          onProgress({ message: event.message, detail: event.detail });
        } else if (event.type === 'error') {
          throw new GenerationProgressStreamError(event.error);
        } else if (event.type === 'result') {
          finalResult = event.data;
        }
      }
      newlineIndex = buffer.indexOf('\n');
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    const event = JSON.parse(trailing) as NdjsonProgressEvent<T>;
    if (event.type === 'progress') {
      onProgress({ message: event.message, detail: event.detail });
    } else if (event.type === 'error') {
      throw new GenerationProgressStreamError(event.error);
    } else if (event.type === 'result') {
      finalResult = event.data;
    }
  }

  if (!finalResult) {
    throw new GenerationProgressStreamError('Progress stream ended without a result');
  }
  if (finalResult.status === 'error') {
    const err =
      typeof finalResult === 'object' && finalResult !== null && 'error' in finalResult && typeof finalResult.error === 'string'
        ? finalResult.error
        : 'Request failed';
    throw new GenerationProgressStreamError(err);
  }
  if (!res.ok) {
    throw new GenerationProgressStreamError(`Request failed (${res.status})`);
  }
  return finalResult;
}