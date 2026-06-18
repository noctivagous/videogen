import {
  augmentPromptForXAIImageEdit,
  buildGenerationPrompt,
  buildGenerationRefs,
  buildReferencePromptLine,
} from '@/lib/studio/generation-prompt';
import { expandPromptMentions, hasPromptImageReferences } from '@/lib/studio/prompt-mentions';
import { isCinematographyRefs } from '@/lib/studio/reference-slots';
import type { ReferenceRole, ScenePreviewPayload } from '@/lib/types/studio';

export function buildPreviewFramePayload(
  payload: ScenePreviewPayload,
  providerId = 'xai',
): {
  prompt: string;
  refs: Array<{ role: ReferenceRole; url: string; slotIndex: number }>;
} {
  const shot = payload.shot;
  const cinematographyRefs = isCinematographyRefs(shot);
  const refs = buildGenerationRefs(shot);

  let prompt = buildGenerationPrompt({
    sceneSetup: shot?.sceneSetup ?? '',
    shotActivity: shot?.shotActivity ?? '',
    camera: payload.camera,
    lighting: payload.lighting,
    motion: payload.motion,
    shot,
  });

  if (!prompt.trim()) {
    prompt = 'Neutral cinematic studio scene.';
  }

  prompt = `Single cinematic still frame photograph. ${prompt}. No text, typography, watermarks, or UI overlays.`;

  if (refs.length > 0) {
    prompt = expandPromptMentions(prompt, shot, providerId, {
      xaiImageIndexOffset: providerId === 'xai' ? -1 : 0,
    });
  }

  if (providerId === 'xai' && refs.length > 0) {
    prompt = augmentPromptForXAIImageEdit(prompt, refs, cinematographyRefs);
  } else if (refs.length > 0 && cinematographyRefs) {
    const refLine = buildReferencePromptLine(refs);
    if (refLine && !hasPromptImageReferences(prompt)) {
      prompt = `${refLine} ${prompt}`;
    }
  }

  return { prompt: prompt.trim(), refs };
}

export function buildPreviewFramePrompt(
  payload: ScenePreviewPayload,
  providerId = 'xai',
): string {
  return buildPreviewFramePayload(payload, providerId).prompt;
}

export function buildPreviewFrameRefs(
  payload: ScenePreviewPayload,
): Array<{ role: ReferenceRole; url: string; slotIndex: number }> {
  return buildPreviewFramePayload(payload).refs;
}