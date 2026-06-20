export interface GenerationProgressUpdate {
  message: string;
  detail?: string;
}

export type GenerationProgressReporter = (update: GenerationProgressUpdate) => void;

export type NdjsonProgressEvent<T> =
  | { type: 'progress'; message: string; detail?: string }
  | { type: 'result'; data: T }
  | { type: 'error'; error: string };

export function noopProgressReporter(): GenerationProgressReporter {
  return () => {};
}

export function wrapProgressReporter(
  report: GenerationProgressReporter | undefined,
): GenerationProgressReporter {
  return report ?? noopProgressReporter();
}

/** Human-readable xAI video poll status (docs: pending | done | failed | expired). */
export function formatXAIVideoPollStatus(status: string | undefined, poll: number, maxPolls: number): string {
  const label =
    status === 'pending'
      ? 'Grok is rendering your video'
      : status
        ? `Status: ${status}`
        : 'Checking job status';
  return `${label} (poll ${poll}/${maxPolls})`;
}