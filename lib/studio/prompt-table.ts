import {
  CAMERA_ANGLE_LABELS,
  CAMERA_COVERAGE_LABELS,
} from '@/lib/constants/camera';
import { formatLensForPrompt } from '@/lib/constants/lens';
import { buildVideoEnvironmentPrompt } from '@/lib/studio/video-environment-prompt';
import { getShotFrameComposition } from '@/lib/studio/composition';
import { buildXAIReferencePrompt, getGenerationFramePrompt } from '@/lib/studio/generation-prompt';
import { getVideoLightingPromptParts } from '@/lib/studio/video-lighting-prompt';
import { prepareSceneTextForGeneration } from '@/lib/studio/legacy-scene-boilerplate';
import { expandPromptMentions } from '@/lib/studio/prompt-mentions';
import {
  FIELD_SIZE_PROMPTS,
  MOVEMENT_PROMPTS,
  SUBJECT_COUNT_PROMPTS,
} from '@/lib/studio/generation-prompt-constants';
import type {
  CameraSettings,
  FrameComposition,
  LightingSettings,
  MotionSettings,
  Shot,
} from '@/lib/types/studio';

export interface PromptTableRow {
  source: string;
  text: string;
}

function splitPromptParts(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const sentences = trimmed
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return sentences.length > 0 ? sentences : [trimmed];
}

function splitCommaParts(text: string): string[] {
  return text
    .split(/,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function pushSceneRows(
  rows: PromptTableRow[],
  source: string,
  text: string,
  shot: Shot | undefined,
  providerId: string,
) {
  for (const part of splitPromptParts(text)) {
    const expanded = expandPromptMentions(part, shot, providerId);
    rows.push({ source, text: expanded });
  }
}

function getCameraPromptParts(camera: CameraSettings, frame: FrameComposition): PromptTableRow[] {
  const rows: PromptTableRow[] = [];

  const field = FIELD_SIZE_PROMPTS[camera.fieldSize] ?? camera.fieldSize;
  if (field) rows.push({ source: 'Camera · Field Size', text: field });

  const count = SUBJECT_COUNT_PROMPTS[camera.subjectCount] ?? camera.subjectCount;
  if (count) rows.push({ source: 'Camera · Subject Count', text: count });

  if (camera.subjectCount === '1s' && camera.coverage !== 'clean') {
    const coverage = CAMERA_COVERAGE_LABELS[camera.coverage];
    if (coverage) rows.push({ source: 'Camera · Coverage', text: coverage.toLowerCase() });
  }

  const framing = getGenerationFramePrompt(camera.fieldSize, frame);
  if (framing) {
    for (const part of splitCommaParts(framing)) {
      rows.push({ source: 'Camera · Frame Composition', text: part });
    }
  }

  const lens = formatLensForPrompt(camera);
  if (lens) rows.push({ source: 'Camera · Lens', text: lens });

  const angle = CAMERA_ANGLE_LABELS[camera.angle]?.toLowerCase() ?? camera.angle.replace(/-/g, ' ');
  const movement = MOVEMENT_PROMPTS[camera.movement];
  if (movement && camera.movement !== 'static') {
    rows.push({ source: 'Camera · Angle', text: `${angle} angle` });
    rows.push({ source: 'Camera · Movement', text: movement });
  } else {
    rows.push({ source: 'Camera · Angle', text: `${angle} camera angle` });
  }

  return rows;
}

function getMotionPromptPart(motion: MotionSettings): PromptTableRow | null {
  if (motion.subjectAction === 'still' || motion.subjectAction === 'none') return null;
  return {
    source: 'Motion & Subject · Subject Action',
    text: `Subject ${motion.subjectAction.replace(/-/g, ' ')} with ${motion.intensity} motion`,
  };
}

export function buildPromptTable(input: {
  sceneSetup: string;
  shotActivity: string;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  shot: Shot | undefined;
  providerId: string;
  refs: Array<{ role: string; url: string }>;
  cinematographyRefs: boolean;
  includeVideoLighting?: boolean;
  includeVideoEnvironment?: boolean;
}): PromptTableRow[] {
  const {
    sceneSetup,
    shotActivity,
    camera,
    lighting,
    motion,
    shot,
    providerId,
    refs,
    cinematographyRefs,
    includeVideoLighting = true,
    includeVideoEnvironment = true,
  } = input;

  const frame = getShotFrameComposition(shot);
  const prepared = prepareSceneTextForGeneration(sceneSetup, shotActivity);
  const rows: PromptTableRow[] = [];

  if (providerId === 'xai' && refs.length > 0 && cinematographyRefs) {
    const xaiRef = buildXAIReferencePrompt(refs);
    for (const part of splitPromptParts(xaiRef)) {
      rows.push({ source: 'Reference Images', text: part });
    }
  }

  pushSceneRows(rows, 'Scene Setup', prepared.sceneSetup, shot, providerId);
  pushSceneRows(rows, 'Shot Activity', prepared.shotActivity, shot, providerId);

  if (includeVideoLighting) {
    rows.push(...getVideoLightingPromptParts(lighting));
  }

  if (includeVideoEnvironment) {
    const videoEnvironment = buildVideoEnvironmentPrompt(lighting);
    for (const part of splitCommaParts(videoEnvironment)) {
      rows.push({ source: 'Atmosphere / Environment', text: part });
    }
  }

  rows.push(...getCameraPromptParts(camera, frame));

  const motionRow = getMotionPromptPart(motion);
  if (motionRow) rows.push(motionRow);

  return rows;
}