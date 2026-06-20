import {
  CAMERA_ANGLE_LABELS,
  CAMERA_COVERAGE_LABELS,
  HEADROOM_FIELD_SIZES,
  placementFramingPrompt,
} from '@/lib/constants/camera';
import { formatLensForPrompt } from '@/lib/constants/lens';
import { buildSlotReferenceRefs } from '@/lib/studio/prompt-mentions';
import type {
  AspectRatio,
  CameraSettings,
  FrameComposition,
  LightingSettings,
  MotionSettings,
  ReferenceRole,
  Shot,
} from '@/lib/types/studio';
import { getShotFrameComposition } from '@/lib/studio/composition';
import {
  FIELD_SIZE_PROMPTS,
  MOVEMENT_PROMPTS,
  SUBJECT_COUNT_PROMPTS,
} from '@/lib/studio/generation-prompt-constants';

import { prepareSceneTextForGeneration } from '@/lib/studio/legacy-scene-boilerplate';
import { shouldInjectFieldSizePrompt } from '@/lib/studio/workflow';

import { buildVideoEnvironmentPrompt } from '@/lib/studio/video-environment-prompt';
import { buildVideoLightingPrompt } from '@/lib/studio/video-lighting-prompt';

export function getGenerationFramePrompt(
  fieldSize: string,
  frame: FrameComposition,
): string {
  if (frame.guide === 'none') return '';

  const parts: string[] = [];

  if (frame.guide === 'grid-3x3') {
    parts.push(placementFramingPrompt(frame.placement));
  } else if (frame.guide === 'center') {
    parts.push('symmetrical centered composition with subject in the exact center of the frame');
  } else if (frame.guide === 'fill-frame') {
    parts.push('subject fills the frame edge to edge');
  }

  if (HEADROOM_FIELD_SIZES.has(fieldSize as never) && frame.headroom !== 'normal') {
    parts.push(`${frame.headroom} headroom above subject`);
  }

  return parts.filter(Boolean).join(', ');
}

export function getGenerationCameraPrompt(
  camera: CameraSettings,
  frame: FrameComposition,
  shot?: Shot,
): string {
  const injectFieldSize = shouldInjectFieldSizePrompt(shot);
  const count = SUBJECT_COUNT_PROMPTS[camera.subjectCount] ?? camera.subjectCount;

  const parts: string[] = [];
  if (injectFieldSize) {
    const field = FIELD_SIZE_PROMPTS[camera.fieldSize] ?? camera.fieldSize;
    parts.push(field);
  }
  parts.push(count);

  if (camera.subjectCount === '1s' && camera.coverage !== 'clean') {
    const coverage = CAMERA_COVERAGE_LABELS[camera.coverage];
    if (coverage) parts.push(coverage.toLowerCase());
  }

  const framing = injectFieldSize ? getGenerationFramePrompt(camera.fieldSize, frame) : '';
  if (framing) parts.push(framing);

  parts.push(formatLensForPrompt(camera));

  const angle = CAMERA_ANGLE_LABELS[camera.angle]?.toLowerCase() ?? camera.angle.replace(/-/g, ' ');
  const movement = MOVEMENT_PROMPTS[camera.movement];
  if (movement && camera.movement !== 'static') {
    parts.push(`${angle} angle, ${movement}`);
  } else {
    parts.push(`${angle} camera angle`);
  }

  return parts.filter(Boolean).join('. ');
}

function buildMotionPrompt(motion: MotionSettings): string {
  if (motion.subjectAction === 'still' || motion.subjectAction === 'none') return '';
  return `Subject ${motion.subjectAction.replace(/-/g, ' ')} with ${motion.intensity} motion`;
}

export function buildGenerationRefs(
  shot: Shot | undefined,
  lighting?: LightingSettings,
  aspectRatio?: AspectRatio,
): Array<{ role: ReferenceRole; url: string; slotIndex: number }> {
  return buildSlotReferenceRefs(shot, lighting, aspectRatio);
}

function xaiReferenceRoleIndices(refs: Array<{ role: string; url: string }>) {
  return {
    subjectIdx: refs.findIndex((r) => r.role === 'Subject'),
    backdropIdx: refs.findIndex((r) => r.role === 'Backdrop'),
    hasSubject: refs.some((r) => r.role === 'Subject'),
    hasBackdrop: refs.some((r) => r.role === 'Backdrop'),
  };
}

function xaiReferenceImageNumber(
  refs: Array<{ role: string; url: string }>,
  role: 'Subject' | 'Backdrop',
): number | null {
  const idx = refs.findIndex((r) => r.role === role);
  return idx >= 0 ? idx + 1 : null;
}

/** Reference instructions for xAI reference-to-video (<IMAGE_N> tags required by API). */
export function buildXAIReferencePrompt(
  refs: Array<{ role: string; url: string }>,
  shot?: Shot,
): string {
  if (shot?.bakedStartFrame && shot.workflow === 'lock-start-frame') {
    const startN = refs.findIndex((r) => r.role === 'Backdrop') + 1;
    const subjectN = xaiReferenceImageNumber(refs, 'Subject');
    if (startN > 0 && subjectN) {
      return (
        `Use <IMAGE_${startN}> as the locked start frame — preserve exact composition, subject positions, and scale. ` +
        `Subject identity (face, body, wardrobe) comes from <IMAGE_${subjectN}> for motion and appearance consistency.`
      );
    }
    if (startN > 0) {
      return `Use <IMAGE_${startN}> as the locked start frame. Preserve exact composition and subject placement.`;
    }
  }

  const subjectN = xaiReferenceImageNumber(refs, 'Subject');
  const backdropN = xaiReferenceImageNumber(refs, 'Backdrop');

  if (subjectN && backdropN) {
    return (
      `The subject in the video — face, body, wardrobe, and proportions only — comes from <IMAGE_${subjectN}>; ` +
      `ignore any background, floor, or environment in <IMAGE_${subjectN}>. ` +
      `The scene environment, backdrop, and floor geometry come from <IMAGE_${backdropN}>. ` +
      `The subject from <IMAGE_${subjectN}> appears in the environment from <IMAGE_${backdropN}>.`
    );
  }
  if (subjectN) {
    return `Use <IMAGE_${subjectN}> as the starting frame. Preserve the subject identity and appearance from <IMAGE_${subjectN}>.`;
  }
  if (backdropN) {
    return `Match the environment, backdrop, and lighting palette from <IMAGE_${backdropN}>.`;
  }
  return '';
}

/** Reference instructions for xAI multi-image edit preview (<IMAGE_0> tags, 0-based). */
export function buildXAIImageEditReferencePrompt(
  refs: Array<{ role: string; url: string }>,
): string {
  const { subjectIdx, backdropIdx, hasSubject, hasBackdrop } = xaiReferenceRoleIndices(refs);

  if (hasSubject && hasBackdrop && subjectIdx >= 0 && backdropIdx >= 0) {
    return (
      `The subject in the still — face, body, wardrobe, and proportions only — comes from <IMAGE_${subjectIdx}>; ` +
      `ignore any background, floor, or environment in <IMAGE_${subjectIdx}>. ` +
      `The scene environment, backdrop, floor, and lighting palette come entirely from <IMAGE_${backdropIdx}>. ` +
      `Place the subject from <IMAGE_${subjectIdx}> in the environment from <IMAGE_${backdropIdx}>.`
    );
  }
  if (hasSubject && subjectIdx >= 0) {
    return `Use <IMAGE_${subjectIdx}> as the starting frame. Preserve the subject identity and appearance from <IMAGE_${subjectIdx}>.`;
  }
  if (hasBackdrop && backdropIdx >= 0) {
    return `Match the environment, backdrop, and lighting palette from <IMAGE_${backdropIdx}>.`;
  }
  return '';
}

export function buildReferencePromptLine(
  refs: { role: ReferenceRole; url: string }[],
): string {
  const hasSubject = refs.some((r) => r.role === 'Subject');
  const hasBackdrop = refs.some((r) => r.role === 'Backdrop');

  if (hasSubject && hasBackdrop) {
    return (
      'Subject identity (face, body, wardrobe only) from the subject reference; ' +
      'ignore any background in the subject reference. ' +
      'Environment, backdrop, floor, and lighting entirely from the backdrop reference.'
    );
  }
  if (hasSubject) {
    return 'Use the subject reference as the starting frame; preserve subject identity and appearance.';
  }
  if (hasBackdrop) {
    return 'Match the environment, backdrop, and lighting palette from the backdrop reference.';
  }
  return '';
}

/**
 * Prompt assembly precedence (xAI video + image reference modes):
 * 1. Reference binding — augmentPromptForXAI; which pixels come from <IMAGE_N>
 * 2. Scene + motion — user story
 * 3. Video lighting techniques — cinematography presets (multi-select)
 * 4. Atmosphere / environment — volumetric overlays
 * 5. Camera — framing, lens, angle, movement
 *
 * Color grading is applied via Theme Transformer reference images, not text prompts.
 */
export function buildGenerationPrompt(input: {
  sceneSetup: string;
  shotActivity: string;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  shot: Shot | undefined;
  includeVideoLighting?: boolean;
  includeVideoEnvironment?: boolean;
}): string {
  const {
    sceneSetup,
    shotActivity,
    camera,
    lighting,
    motion,
    shot,
    includeVideoLighting = true,
    includeVideoEnvironment = true,
  } = input;
  const frame = getShotFrameComposition(shot);

  const prepared = prepareSceneTextForGeneration(sceneSetup, shotActivity);
  const sceneParts = [prepared.sceneSetup, prepared.shotActivity].filter(Boolean);
  const sceneBlock = sceneParts.join('. ');
  const videoLightingLine =
    includeVideoLighting ? buildVideoLightingPrompt(lighting) : '';
  const videoEnvironmentLine =
    includeVideoEnvironment ? buildVideoEnvironmentPrompt(lighting) : '';
  const cameraLine = getGenerationCameraPrompt(camera, frame, shot);
  const motionLine = buildMotionPrompt(motion);

  const blocks = [sceneBlock, videoLightingLine, videoEnvironmentLine, cameraLine, motionLine];

  return blocks
    .filter(Boolean)
    .join('. ')
    .replace(/\.\s*\./g, '.')
    .trim();
}

/** Prepends xAI <IMAGE_N> instructions when the adapter will send reference images. */
export function augmentPromptForXAI(
  prompt: string,
  refs: Array<{ role: string; url: string }>,
  cinematographyRefs = true,
  shot?: Shot,
): string {
  if (!cinematographyRefs) return prompt;
  const xaiRef = buildXAIReferencePrompt(refs, shot);
  if (!xaiRef) return prompt;
  return `${xaiRef} ${prompt}`.trim();
}

/** Prepends xAI <IMAGE_0> edit instructions when the image preview adapter sends reference images. */
export function augmentPromptForXAIImageEdit(
  prompt: string,
  refs: Array<{ role: string; url: string }>,
  cinematographyRefs = true,
): string {
  if (!cinematographyRefs) return prompt;
  const xaiRef = buildXAIImageEditReferencePrompt(refs);
  if (!xaiRef) return prompt;
  return `${xaiRef} ${prompt}`.trim();
}