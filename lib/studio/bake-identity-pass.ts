import {
  getAssignedMannequins,
  mannequinSpatialLabel,
  type MannequinSpatialLabel,
} from '@/lib/studio/mannequin-character-assignment';
import {
  augmentPromptForXAIImageEdit,
  buildMultiSubjectBakeIdentityPrompt,
} from '@/lib/studio/generation-prompt';
import type { GenerationRef } from '@/lib/studio/generation/types';
import type { LightingSettings, Mannequin, Shot } from '@/lib/types/studio';

const SINGLE_SUBJECT_BASE_PROMPT =
  'Place the subject from the character sheet into the scene, preserving exact position, scale, and lighting. Seamless photorealistic integration.';

export interface BakeIdentityPassSpec {
  prompt: string;
  refs: GenerationRef[];
}

export interface BakeIdentityPassPlan {
  passes: BakeIdentityPassSpec[];
}

function subjectSheetUrl(shot: Shot, slotIndex: number): string | null {
  return shot.references[slotIndex] ?? null;
}

function buildPassForAssignments(
  shot: Shot,
  assigned: Mannequin[],
  sceneUrl: string,
  spatialContext: Mannequin[],
): BakeIdentityPassSpec | null {
  if (assigned.length === 0) return null;

  const sorted = [...assigned].sort((a, b) => a.x - b.x);

  if (sorted.length === 1) {
    const mannequin = sorted[0];
    const slotIndex = mannequin.subjectSlotIndex;
    if (slotIndex == null) return null;
    const sheetUrl = subjectSheetUrl(shot, slotIndex);
    if (!sheetUrl) return null;
    const refs: GenerationRef[] = [
      { role: 'Subject', url: sheetUrl, slotIndex },
      { role: 'Backdrop', url: sceneUrl, slotIndex: -1 },
    ];
    return {
      prompt: augmentPromptForXAIImageEdit(SINGLE_SUBJECT_BASE_PROMPT, refs, true),
      refs,
    };
  }

  const sheets: string[] = [];
  const promptAssignments: Array<{ spatialLabel: MannequinSpatialLabel; imageTag: string }> = [];

  for (let i = 0; i < sorted.length; i++) {
    const mannequin = sorted[i];
    const slotIndex = mannequin.subjectSlotIndex;
    if (slotIndex == null) return null;
    const sheetUrl = subjectSheetUrl(shot, slotIndex);
    if (!sheetUrl) return null;
    sheets.push(sheetUrl);
    promptAssignments.push({
      spatialLabel: mannequinSpatialLabel(mannequin, spatialContext),
      imageTag: `<IMAGE_${i}>`,
    });
  }

  const refs: GenerationRef[] = [
    ...sorted.map((m, i) => ({
      role: 'Subject' as const,
      url: sheets[i]!,
      slotIndex: m.subjectSlotIndex!,
    })),
    { role: 'Backdrop', url: sceneUrl, slotIndex: -1 },
  ];

  const sceneImageTag = `<IMAGE_${sorted.length}>`;
  return {
    prompt: buildMultiSubjectBakeIdentityPrompt(promptAssignments, sceneImageTag),
    refs,
  };
}

/** Builds sequential Pass 2 specs from mannequin → sheet assignments. Returns null when no principals are assigned. */
export function buildIdentityPassPlan(
  shot: Shot,
  bakedSceneUrl: string,
  _lighting?: LightingSettings,
): BakeIdentityPassPlan | null {
  const assigned = getAssignedMannequins(shot, _lighting).sort((a, b) => a.x - b.x);
  if (assigned.length === 0) return null;

  if (assigned.length <= 2) {
    const spec = buildPassForAssignments(shot, assigned, bakedSceneUrl, assigned);
    return spec ? { passes: [spec] } : null;
  }

  const firstTwo = assigned.slice(0, 2);
  const third = assigned[2];
  const pass1 = buildPassForAssignments(shot, firstTwo, bakedSceneUrl, assigned);
  if (!pass1 || third.subjectSlotIndex == null) return null;

  const thirdUrl = subjectSheetUrl(shot, third.subjectSlotIndex);
  if (!thirdUrl) return null;

  const pass2Refs: GenerationRef[] = [
    { role: 'Subject', url: thirdUrl, slotIndex: third.subjectSlotIndex },
    { role: 'Backdrop', url: bakedSceneUrl, slotIndex: -1 },
  ];
  const pass2: BakeIdentityPassSpec = {
    prompt: buildMultiSubjectBakeIdentityPrompt(
      [{ spatialLabel: mannequinSpatialLabel(third, assigned), imageTag: '<IMAGE_0>' }],
      '<IMAGE_1>',
    ),
    refs: pass2Refs,
  };

  return { passes: [pass1, pass2] };
}