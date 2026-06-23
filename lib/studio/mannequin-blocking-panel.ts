import type { PreviewSubMode, Shot } from '@/lib/types/studio';
import { getWorkflow, isBakeStartFrame } from '@/lib/studio/workflow';

/** Workflows that show mannequin blocking UI in framing mode. */
export function usesMannequinBlockingPanel(
  shot: Shot | undefined,
  previewSubMode: PreviewSubMode,
): boolean {
  if (!shot || previewSubMode !== 'framing') return false;
  const workflow = getWorkflow(shot);
  return isBakeStartFrame(shot) || workflow === 'auto-place';
}
