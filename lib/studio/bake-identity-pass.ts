import {
  getAssignedMannequins,
  mannequinSpatialLabel,
  type MannequinSpatialLabel,
} from '@/lib/studio/mannequin-character-assignment';
import { buildMultiSubjectBakeIdentityPrompt } from '@/lib/studio/generation-prompt';
import { mannequinAngleLabel } from '@/lib/studio/mannequin-rotation';
import type { GenerationRef } from '@/lib/studio/generation/types';
import type { LightingSettings, Mannequin, Shot } from '@/lib/types/studio';

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

function buildIdentityAssignments(
  assigned: Mannequin[],
  spatialContext: Mannequin[],
): Array<{ spatialLabel: MannequinSpatialLabel; imageTag: string; facingLabel: string }> {
  const sorted = [...assigned].sort((a, b) => a.x - b.x);
  return sorted.map((mannequin, i) => ({
    spatialLabel: mannequinSpatialLabel(mannequin, spatialContext),
    // Scene is always <IMAGE_0> — character sheets start at <IMAGE_1>.
    imageTag: `<IMAGE_${i + 1}>`,
    facingLabel: mannequinAngleLabel(mannequin.angle),
  }));
}

function buildPassForAssignments(
  shot: Shot,
  assigned: Mannequin[],
  sceneUrl: string,
  spatialContext: Mannequin[],
): BakeIdentityPassSpec | null {
  if (assigned.length === 0) return null;

  const sorted = [...assigned].sort((a, b) => a.x - b.x);
  const subjectRefs: GenerationRef[] = [];
  for (const mannequin of sorted) {
    const slotIndex = mannequin.subjectSlotIndex;
    if (slotIndex == null) return null;
    const sheetUrl = subjectSheetUrl(shot, slotIndex);
    if (!sheetUrl) return null;
    subjectRefs.push({ role: 'Subject', url: sheetUrl, slotIndex });
  }

  // xAI multi-image edit follows the first input image for composition — scene must be first.
  const refs: GenerationRef[] = [
    { role: 'Backdrop', url: sceneUrl, slotIndex: -1 },
    ...subjectRefs,
  ];

  const sceneImageTag = '<IMAGE_0>';
  const promptAssignments = buildIdentityAssignments(sorted, spatialContext);

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
    { role: 'Backdrop', url: bakedSceneUrl, slotIndex: -1 },
    { role: 'Subject', url: thirdUrl, slotIndex: third.subjectSlotIndex },
  ];
  const pass2: BakeIdentityPassSpec = {
    prompt: buildMultiSubjectBakeIdentityPrompt(
      buildIdentityAssignments([third], assigned),
      '<IMAGE_0>',
    ),
    refs: pass2Refs,
  };

  return { passes: [pass1, pass2] };
}