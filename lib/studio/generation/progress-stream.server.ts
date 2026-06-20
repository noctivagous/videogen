import type { GenerationProgressReporter, NdjsonProgressEvent } from '@/lib/studio/generation/progress';

const NDJSON_CONTENT_TYPE = 'application/x-ndjson; charset=utf-8';

function encodeNdjsonLine<T>(event: NdjsonProgressEvent<T>): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

/** Stream progress events as NDJSON, then a final result or error line. */
export function createNdjsonProgressStreamResponse<T>(
  run: (report: GenerationProgressReporter) => Promise<T>,
  isError: (result: T) => boolean,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const report: GenerationProgressReporter = (update) => {
        controller.enqueue(
          encodeNdjsonLine<T>({
            type: 'progress',
            message: update.message,
            detail: update.detail,
          }),
        );
      };

      try {
        const data = await run(report);
        if (isError(data)) {
          const error =
            typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
              ? data.error
              : 'Request failed';
          controller.enqueue(encodeNdjsonLine<T>({ type: 'error', error }));
        } else {
          controller.enqueue(encodeNdjsonLine<T>({ type: 'result', data }));
        }
      } catch (e) {
        controller.enqueue(
          encodeNdjsonLine<T>({
            type: 'error',
            error: e instanceof Error ? e.message : 'Request failed',
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': NDJSON_CONTENT_TYPE,
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
    // Always 200 — business errors are encoded as NDJSON `error` / result events.
    status: 200,
  });
}

export function wantsProgressStream(body: { streamProgress?: boolean } | null | undefined): boolean {
  return Boolean(body?.streamProgress);
}