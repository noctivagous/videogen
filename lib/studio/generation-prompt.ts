import {
  CAMERA_ANGLE_LABELS,
  CAMERA_COVERAGE_LABELS,
  HEADROOM_FIELD_SIZES,
  normalizeReferenceRole,
  placementFramingPrompt,
} from '@/lib/constants/camera';
import { formatLensForPrompt } from '@/lib/constants/lens';
import {
  getBackdropReference,
  getGenerationSubjectReference,
} from '@/lib/constants/stock-demo';
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
import { sanitizeSceneTextForGeneration } from '@/lib/studio/prompt-sanitize';

export function getGenerationFramePrompt(
  fieldSize: string,
  frame: FrameComposition,
): string {
  if (frame.guide === 'none') return '';

  const parts: string[] = [];

  if (frame.guide === 'grid-3x3') {
    parts.push('rule of thirds composition');
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
): { role: ReferenceRole; url: string }[] {
  const refs: { role: ReferenceRole; url: string }[] = [];

  const subject = getGenerationSubjectReference(shot);
  const backdrop = getBackdropReference(shot);
  if (subject) refs.push({ role: 'Subject', url: subject });
  if (backdrop) refs.push({ role: 'Backdrop', url: backdrop });

  if (shot) {
    for (let i = 0; i < shot.references.length; i++) {
      const url = shot.references[i];
      const role = normalizeReferenceRole(shot.referenceRoles[i] ?? 'None');
      if (!url || role === 'None' || role === 'Subject' || role === 'Backdrop') continue;
      if (!refs.some((r) => r.role === role && r.url === url)) {
        refs.push({ role, url });
      }
    }
  }

  return refs;
}

/** Reference instructions for xAI reference-to-video (<IMAGE_N> tags required by API). */
export function buildXAIReferencePrompt(refs: Array<{ role: string; url: string }>): string {
  const hasSubject = refs.some((r) => r.role === 'Subject');
  const hasBackdrop = refs.some((r) => r.role === 'Backdrop');

  if (hasSubject && hasBackdrop) {
    return 'Match the subject identity and appearance from <IMAGE_1>. Match the environment, background, and lighting palette from <IMAGE_2>.';
  }
  if (hasSubject) {
    return 'Use <IMAGE_1> as the starting frame and preserve the subject identity.';
  }
  if (hasBackdrop) {
    return 'Match the environment and lighting palette from <IMAGE_1>.';
  }
  return '';
}

export function buildReferencePromptLine(refs: { role: ReferenceRole; url: string }[]): string {
  const hasSubject = refs.some((r) => r.role === 'Subject');
  const hasBackdrop = refs.some((r) => r.role === 'Backdrop');

  if (hasSubject && hasBackdrop) {
    return 'Match the subject identity from the subject reference image and the environment from the backdrop reference image.';
  }
  if (hasSubject) {
    return 'Match the subject identity and appearance from the subject reference image.';
  }
  if (hasBackdrop) {
    return 'Match the environment, background, and lighting from the backdrop reference image.';
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
  refs?: { role: ReferenceRole; url: string }[];
}): string {
  const { sceneSetup, shotActivity, camera, lighting, motion, shot, refs = [] } = input;
  const frame = getShotFrameComposition(shot);

  const sanitized = sanitizeSceneTextForGeneration(sceneSetup, shotActivity, {
    refs,
    camera,
    lighting,
    frame,
  });
  const sceneParts = [sanitized.sceneSetup, sanitized.shotActivity].filter(Boolean);
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
): string {
  const xaiRef = buildXAIReferencePrompt(refs);
  if (!xaiRef || prompt.includes('<IMAGE_1>')) return prompt;
  return `${xaiRef} ${prompt}`.trim();
}