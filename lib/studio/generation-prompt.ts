import {
  CAMERA_ANGLE_LABELS,
  CAMERA_COVERAGE_LABELS,
  HEADROOM_FIELD_SIZES,
  placementFramingPrompt,
} from '@/lib/constants/camera';
import { formatLensForPrompt } from '@/lib/constants/lens';
import { buildSlotReferenceRefs } from '@/lib/studio/prompt-mentions';
import type {
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
import { hasPromptImageReferences } from '@/lib/studio/prompt-mentions';

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
): string {
  const field = FIELD_SIZE_PROMPTS[camera.fieldSize] ?? camera.fieldSize;
  const count = SUBJECT_COUNT_PROMPTS[camera.subjectCount] ?? camera.subjectCount;

  const parts = [field, count];

  if (camera.subjectCount === '1s' && camera.coverage !== 'clean') {
    const coverage = CAMERA_COVERAGE_LABELS[camera.coverage];
    if (coverage) parts.push(coverage.toLowerCase());
  }

  const framing = getGenerationFramePrompt(camera.fieldSize, frame);
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

function buildLightingPrompt(lighting: LightingSettings): string {
  const parts = [
    `${lighting.style} lighting with ${lighting.keyLight} key light`,
    `${lighting.timeOfDay.replace(/-/g, ' ')}, ${lighting.colorTemp}K color temperature`,
  ];
  if (lighting.atmosphere !== 'clear') {
    parts.push(`${lighting.atmosphere.replace(/-/g, ' ')} atmosphere`);
  }
  return parts.join('. ');
}

function buildMotionPrompt(motion: MotionSettings): string {
  if (motion.subjectAction === 'still') return '';
  return `Subject ${motion.subjectAction.replace(/-/g, ' ')} with ${motion.intensity} motion`;
}

export function buildGenerationRefs(
  shot: Shot | undefined,
): Array<{ role: ReferenceRole; url: string; slotIndex: number }> {
  return buildSlotReferenceRefs(shot);
}

function xaiReferenceRoleIndices(refs: Array<{ role: string; url: string }>) {
  return {
    subjectIdx: refs.findIndex((r) => r.role === 'Subject'),
    backdropIdx: refs.findIndex((r) => r.role === 'Backdrop'),
    hasSubject: refs.some((r) => r.role === 'Subject'),
    hasBackdrop: refs.some((r) => r.role === 'Backdrop'),
  };
}

/** Reference instructions for xAI reference-to-video (<IMAGE_N> tags required by API). */
export function buildXAIReferencePrompt(refs: Array<{ role: string; url: string }>): string {
  const hasSubject = refs.some((r) => r.role === 'Subject');
  const hasBackdrop = refs.some((r) => r.role === 'Backdrop');

  if (hasSubject && hasBackdrop) {
    return (
      'The subject in the video — face, body, wardrobe, and proportions only — comes from <IMAGE_1>; ' +
      'ignore any background, floor, or environment in <IMAGE_1>. ' +
      'The scene environment, backdrop, floor, and lighting palette come entirely from <IMAGE_2>. ' +
      'The subject from <IMAGE_1> appears in the environment from <IMAGE_2>.'
    );
  }
  if (hasSubject) {
    return 'Use <IMAGE_1> as the starting frame. Preserve the subject identity and appearance from <IMAGE_1>.';
  }
  if (hasBackdrop) {
    return 'Match the environment, backdrop, and lighting palette from <IMAGE_1>.';
  }
  return '';
}

/** Reference instructions for xAI multi-image edit preview (<IMAGE_0> tags, 0-based). */
export function buildXAIImageEditReferencePrompt(refs: Array<{ role: string; url: string }>): string {
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

export function buildReferencePromptLine(refs: { role: ReferenceRole; url: string }[]): string {
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

export function buildGenerationPrompt(input: {
  sceneSetup: string;
  shotActivity: string;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  shot: Shot | undefined;
}): string {
  const { sceneSetup, shotActivity, camera, lighting, motion, shot } = input;
  const frame = getShotFrameComposition(shot);

  const prepared = prepareSceneTextForGeneration(sceneSetup, shotActivity);
  const sceneParts = [prepared.sceneSetup, prepared.shotActivity].filter(Boolean);
  const sceneBlock = sceneParts.join('. ');
  const cameraLine = getGenerationCameraPrompt(camera, frame);
  const lightingLine = buildLightingPrompt(lighting);
  const motionLine = buildMotionPrompt(motion);

  return [sceneBlock, cameraLine, lightingLine, motionLine]
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
): string {
  if (!cinematographyRefs) return prompt;
  const xaiRef = buildXAIReferencePrompt(refs);
  if (!xaiRef || hasPromptImageReferences(prompt)) return prompt;
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
  if (!xaiRef || hasPromptImageReferences(prompt)) return prompt;
  return `${xaiRef} ${prompt}`.trim();
}