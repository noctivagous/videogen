import { CAMERA_FIELD_SIZE_SHORT } from '@/lib/constants/camera';
import { STOCK_ASSETS } from '@/lib/constants/stock-demo';
import { getShotFrameComposition } from '@/lib/studio/composition';
import { getGenerationFramePrompt } from '@/lib/studio/generation-prompt';
import type { ScenePreviewPayload } from '@/lib/types/studio';

export function buildPreviewFramePrompt(payload: ScenePreviewPayload): string {
  const shot = payload.shot;
  const frame = getShotFrameComposition(shot);
  const fieldLabel = CAMERA_FIELD_SIZE_SHORT[payload.camera.fieldSize] || payload.camera.fieldSize.toUpperCase();
  const composition = getGenerationFramePrompt(payload.camera.fieldSize, frame);
  const scene = shot?.sceneSetup?.trim() || 'Neutral cinematic studio scene';
  const activity = shot?.shotActivity?.trim();

  const parts = [
    'Single cinematic still frame photograph.',
    `Framing: ${fieldLabel}${composition ? `. ${composition}` : ''}.`,
    `Scene: ${scene}.`,
  ];
  if (activity) parts.push(`Action: ${activity}.`);
  parts.push('Match subject identity and wardrobe from the subject reference.');
  parts.push('Match environment, lighting, and palette from the backdrop reference.');
  parts.push('No text, typography, watermarks, or UI overlays.');

  return parts.join(' ');
}

export function buildPreviewFrameRefs(payload: ScenePreviewPayload): Array<{ role: string; url: string }> {
  const shot = payload.shot;
  const refs: Array<{ role: string; url: string }> = [];

  if (shot) {
    for (let i = 0; i < shot.references.length; i++) {
      const url = shot.references[i];
      const role = shot.referenceRoles[i];
      if (url && role && role !== 'None') {
        refs.push({ role, url });
      }
    }
  }

  if (!refs.some((r) => r.role === 'Subject')) {
    refs.unshift({ role: 'Subject', url: STOCK_ASSETS.mannequinIdentity });
  }
  if (!refs.some((r) => r.role === 'Backdrop')) {
    refs.push({ role: 'Backdrop', url: STOCK_ASSETS.studioBackdrop });
  }

  return refs;
}