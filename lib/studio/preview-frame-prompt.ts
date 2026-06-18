import { CAMERA_FIELD_SIZE_SHORT } from '@/lib/constants/camera';
import { STOCK_BACKDROP_REF, STOCK_CHARACTER_REF } from '@/lib/constants/stock-project';
import { getShotFrameComposition } from '@/lib/studio/composition';
import { buildGenerationRefs, getGenerationFramePrompt } from '@/lib/studio/generation-prompt';
import { expandPromptMentions } from '@/lib/studio/prompt-mentions';
import { isCinematographyRefs } from '@/lib/studio/reference-slots';
import type { ScenePreviewPayload } from '@/lib/types/studio';

export function buildPreviewFramePrompt(
  payload: ScenePreviewPayload,
  providerId = 'xai',
): string {
  const shot = payload.shot;
  const frame = getShotFrameComposition(shot);
  const fieldLabel = CAMERA_FIELD_SIZE_SHORT[payload.camera.fieldSize] || payload.camera.fieldSize.toUpperCase();
  const composition = getGenerationFramePrompt(payload.camera.fieldSize, frame);
  const expand = (text: string) => expandPromptMentions(text, shot, providerId);
  const scene = expand(shot?.sceneSetup?.trim() || 'Neutral cinematic studio scene');
  const activity = shot?.shotActivity?.trim();

  const parts = [
    'Single cinematic still frame photograph.',
    `Framing: ${fieldLabel}${composition ? `. ${composition}` : ''}.`,
    `Scene: ${scene}.`,
  ];
  if (activity) parts.push(`Action: ${expand(activity)}.`);
  if (isCinematographyRefs(shot)) {
    parts.push(
      'Subject identity (face, body, wardrobe only) from the subject reference; ignore any background in the subject reference.',
    );
    parts.push('Environment, backdrop, floor, and lighting entirely from the backdrop reference.');
  }
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

  if (isCinematographyRefs(shot)) {
    if (!refs.some((r) => r.role === 'Subject')) {
      refs.unshift({ role: 'Subject', url: STOCK_CHARACTER_REF });
    }
    if (!refs.some((r) => r.role === 'Backdrop')) {
      refs.push({ role: 'Backdrop', url: STOCK_BACKDROP_REF });
    }
  }

  return refs;
}