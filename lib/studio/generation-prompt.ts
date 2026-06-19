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
import { isColorPaletteActive } from '@/lib/constants/color-palette';
import { buildColorGradeDirective } from '@/lib/studio/color-mood-prompt';
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
  const paletteEnabled = isColorPaletteActive(lighting.colorPalette);
  const parts = [
    paletteEnabled
      ? `${lighting.keyLight} key light`
      : `${lighting.style} lighting with ${lighting.keyLight} key light`,
    paletteEnabled
      ? lighting.timeOfDay.replace(/-/g, ' ')
      : `${lighting.timeOfDay.replace(/-/g, ' ')}, ${lighting.colorTemp}K color temperature`,
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

function usesPromptColorGrade(lighting?: LightingSettings): boolean {
  return Boolean(lighting && isColorPaletteActive(lighting.colorPalette));
}

function backdropEnvironmentClause(lighting?: LightingSettings): string {
  if (usesPromptColorGrade(lighting)) {
    return (
      'The scene environment, backdrop, and floor geometry come from <IMAGE_2>; ' +
      'use only spatial layout from <IMAGE_2>; its native colors and lighting mood are replaced by the cinematic look directive in this prompt. ' +
      'Apply the cinematic look stated in this prompt to subject and environment.'
    );
  }
  return 'The scene environment, backdrop, floor, and lighting palette come entirely from <IMAGE_2>.';
}

function backdropOnlyClause(lighting?: LightingSettings): string {
  if (usesPromptColorGrade(lighting)) {
    return (
      'Match the environment, backdrop, and floor geometry from <IMAGE_1>; ' +
      'use only spatial layout from <IMAGE_1>, then apply the cinematic look directive in this prompt to the entire frame.'
    );
  }
  return 'Match the environment, backdrop, and lighting palette from <IMAGE_1>.';
}

/** Bookend reinforcement when refs are present — video models weight early/late tokens heavily. */
export function buildColorGradeOverrideSuffix(lighting?: LightingSettings): string {
  if (!usesPromptColorGrade(lighting)) return '';
  return (
    'The final rendered video must use the cinematic look directive above across every frame; ' +
    'reference image colors and lighting are for identity and layout only.'
  );
}

/** Reference instructions for xAI reference-to-video (<IMAGE_N> tags required by API). */
export function buildXAIReferencePrompt(
  refs: Array<{ role: string; url: string }>,
  lighting?: LightingSettings,
): string {
  const hasSubject = refs.some((r) => r.role === 'Subject');
  const hasBackdrop = refs.some((r) => r.role === 'Backdrop');

  if (hasSubject && hasBackdrop) {
    return (
      'The subject in the video — face, body, wardrobe, and proportions only — comes from <IMAGE_1>; ' +
      'ignore any background, floor, or environment in <IMAGE_1>. ' +
      `${backdropEnvironmentClause(lighting)} ` +
      'The subject from <IMAGE_1> appears in the environment from <IMAGE_2>.'
    );
  }
  if (hasSubject) {
    const grade = usesPromptColorGrade(lighting)
      ? ' Apply the color grading and lighting mood from this prompt to the entire frame.'
      : '';
    return `Use <IMAGE_1> as the starting frame. Preserve the subject identity and appearance from <IMAGE_1>.${grade}`;
  }
  if (hasBackdrop) {
    return backdropOnlyClause(lighting);
  }
  return '';
}

/** Reference instructions for xAI multi-image edit preview (<IMAGE_0> tags, 0-based). */
export function buildXAIImageEditReferencePrompt(
  refs: Array<{ role: string; url: string }>,
  lighting?: LightingSettings,
): string {
  const { subjectIdx, backdropIdx, hasSubject, hasBackdrop } = xaiReferenceRoleIndices(refs);

  if (hasSubject && hasBackdrop && subjectIdx >= 0 && backdropIdx >= 0) {
    const backdropClause = usesPromptColorGrade(lighting)
      ? `The scene environment, backdrop, and floor geometry come from <IMAGE_${backdropIdx}>; use only spatial layout from <IMAGE_${backdropIdx}>, its native colors are replaced by the color grade directive in this prompt. Colorize subject and environment using the cinematic color grade stated in this prompt.`
      : `The scene environment, backdrop, floor, and lighting palette come entirely from <IMAGE_${backdropIdx}>.`;
    return (
      `The subject in the still — face, body, wardrobe, and proportions only — comes from <IMAGE_${subjectIdx}>; ` +
      `ignore any background, floor, or environment in <IMAGE_${subjectIdx}>. ` +
      `${backdropClause} ` +
      `Place the subject from <IMAGE_${subjectIdx}> in the environment from <IMAGE_${backdropIdx}>.`
    );
  }
  if (hasSubject && subjectIdx >= 0) {
    const grade = usesPromptColorGrade(lighting)
      ? ' Apply the color grading and lighting mood from this prompt to the entire frame.'
      : '';
    return `Use <IMAGE_${subjectIdx}> as the starting frame. Preserve the subject identity and appearance from <IMAGE_${subjectIdx}>.${grade}`;
  }
  if (hasBackdrop && backdropIdx >= 0) {
    if (usesPromptColorGrade(lighting)) {
      return (
        `Match the environment, backdrop, and floor geometry from <IMAGE_${backdropIdx}>; ` +
        'ignore its color grade. Apply the color grading and lighting mood from this prompt to the entire frame.'
      );
    }
    return `Match the environment, backdrop, and lighting palette from <IMAGE_${backdropIdx}>.`;
  }
  return '';
}

export function buildReferencePromptLine(
  refs: { role: ReferenceRole; url: string }[],
  lighting?: LightingSettings,
): string {
  const hasSubject = refs.some((r) => r.role === 'Subject');
  const hasBackdrop = refs.some((r) => r.role === 'Backdrop');

  if (hasSubject && hasBackdrop) {
    const backdropPart = usesPromptColorGrade(lighting)
      ? 'Environment, backdrop, and floor geometry from the backdrop reference; color grade and lighting mood from this prompt applied to the entire frame.'
      : 'Environment, backdrop, floor, and lighting entirely from the backdrop reference.';
    return (
      'Subject identity (face, body, wardrobe only) from the subject reference; ' +
      'ignore any background in the subject reference. ' +
      backdropPart
    );
  }
  if (hasSubject) {
    const grade = usesPromptColorGrade(lighting)
      ? ' Apply color grading and lighting mood from this prompt to the entire frame.'
      : '';
    return `Use the subject reference as the starting frame; preserve subject identity and appearance.${grade}`;
  }
  if (hasBackdrop) {
    return usesPromptColorGrade(lighting)
      ? 'Match environment, backdrop, and floor geometry from the backdrop reference; apply color grading and lighting mood from this prompt.'
      : 'Match the environment, backdrop, and lighting palette from the backdrop reference.';
  }
  return '';
}

/**
 * Prompt assembly precedence (xAI video + image reference modes):
 *
 * 1. Color grade directive — Look Library / palette; leads the assembled prompt when active
 * 2. Reference binding — augmentPromptForXAI; which pixels come from <IMAGE_N>
 * 3. Scene + motion — user story (what happens)
 * 4. Camera — framing, lens, angle, movement
 * 5. Lighting fill — key light quality, time of day (style words deduped when palette on)
 * 6. Color bookend — appended by augment when refs + palette (late reinforcement)
 *
 * Guides: xAI ref-to-video uses inline <IMAGE_N> binding + narrative;
 * Runway i2v treats input image as style source unless prompt requests visual change;
 * Veo/Nova recommend style & ambiance as explicit blocks, not buried after camera specs.
 */
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
  const colorDirective = buildColorGradeDirective(lighting);
  const lightingLine = buildLightingPrompt(lighting);
  const motionLine = buildMotionPrompt(motion);

  const blocks = colorDirective
    ? [colorDirective, sceneBlock, motionLine, cameraLine, lightingLine]
    : [sceneBlock, cameraLine, lightingLine, motionLine];

  return blocks
    .filter(Boolean)
    .join('. ')
    .replace(/\.\s*\./g, '.')
    .trim();
}

function appendColorGradeOverride(prompt: string, lighting?: LightingSettings): string {
  const suffix = buildColorGradeOverrideSuffix(lighting);
  if (!suffix || prompt.includes(suffix)) return prompt;
  return `${prompt} ${suffix}`.trim();
}

function stripLeadingColorDirective(prompt: string, colorDirective: string): string {
  if (!colorDirective || !prompt.startsWith(colorDirective)) return prompt;
  return prompt.slice(colorDirective.length).replace(/^\.\s*/, '').trim();
}

/** Color & mood first, then optional reference binding, then the rest of the assembled prompt. */
function assemblePromptLeadingWithColor(
  prompt: string,
  lighting: LightingSettings | undefined,
  ...middleBlocks: string[]
): string {
  const colorDirective = lighting ? buildColorGradeDirective(lighting) : '';
  const body = stripLeadingColorDirective(prompt, colorDirective);
  const parts = [colorDirective, ...middleBlocks.filter(Boolean), body].filter(Boolean);
  return parts.join(' ').trim();
}

/** Prepends xAI <IMAGE_N> instructions when the adapter will send reference images. */
export function augmentPromptForXAI(
  prompt: string,
  refs: Array<{ role: string; url: string }>,
  cinematographyRefs = true,
  lighting?: LightingSettings,
): string {
  if (!cinematographyRefs) return appendColorGradeOverride(prompt, lighting);
  const xaiRef = buildXAIReferencePrompt(refs, lighting);
  if (!xaiRef || hasPromptImageReferences(prompt)) {
    return appendColorGradeOverride(prompt, lighting);
  }
  return appendColorGradeOverride(
    assemblePromptLeadingWithColor(prompt, lighting, xaiRef),
    lighting,
  );
}

/** Prepends xAI <IMAGE_0> edit instructions when the image preview adapter sends reference images. */
export function augmentPromptForXAIImageEdit(
  prompt: string,
  refs: Array<{ role: string; url: string }>,
  cinematographyRefs = true,
  lighting?: LightingSettings,
): string {
  if (!cinematographyRefs) return appendColorGradeOverride(prompt, lighting);
  const xaiRef = buildXAIImageEditReferencePrompt(refs, lighting);
  if (!xaiRef || hasPromptImageReferences(prompt)) {
    return appendColorGradeOverride(prompt, lighting);
  }
  return appendColorGradeOverride(
    assemblePromptLeadingWithColor(prompt, lighting, xaiRef),
    lighting,
  );
}