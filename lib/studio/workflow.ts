import { normalizeReferenceRole } from '@/lib/constants/camera';
import { normalizeWorkflow } from '@/lib/constants/workflows';
import { syncMannequinsFromShot } from '@/lib/studio/mannequin-sync';
import { getBackdropSlotIndex, isBackdropCropCommitted } from '@/lib/studio/backdrop-framing';
import { getSubjectReference } from '@/lib/constants/stock-demo';
import type {
  AspectRatio,
  BakeStatus,
  LightingSettings,
  Mannequin,
  ReferenceRole,
  Shot,
  Workflow,
} from '@/lib/types/studio';
import {
  areCharacterSheetsComplete,
  getPrincipalMannequins,
  getRequiredSubjectSheetCount,
  isCharacterAssignmentComplete,
  sanitizeMannequinSubjectSlots,
  tryAutoAssignSingleSubject,
} from '@/lib/studio/mannequin-character-assignment';
import { effectiveReferenceUrl } from '@/lib/studio/theme-transform';

export {
  areCharacterSheetsComplete,
  getAssignedMannequins,
  getExpectedPrincipalCount,
  getPrincipalMannequins,
  getRequiredSubjectSheetCount,
  getSubjectSlotIndices,
  isCharacterAssignmentComplete,
  isPrincipalMannequin,
  isValidSubjectSlotAssignment,
  mannequinSpatialLabel,
  requiresCharacterAssignment,
  type MannequinSpatialLabel,
} from '@/lib/studio/mannequin-character-assignment';

export type WorkflowStepId =
  | 'character-sheet'
  | 'backdrop'
  | 'lock-backdrop'
  | 'place-mannequins'
  | 'assign-characters'
  | 'bake';

export interface WorkflowReferenceStep {
  id: WorkflowStepId;
  label: string;
  done: boolean;
}

export function getWorkflow(shot: Shot | undefined): Workflow {
  return normalizeWorkflow(shot);
}

export function isBakeStartFrame(shot: Shot | undefined): boolean {
  return getWorkflow(shot) === 'bake-start-frame';
}

/** @deprecated Use isBakeStartFrame */
export function isLockStartFrame(shot: Shot | undefined): boolean {
  return isBakeStartFrame(shot);
}

function subjectSlotIndex(shot: Shot): number {
  for (let i = 0; i < shot.referenceRoles.length; i++) {
    if (normalizeReferenceRole(shot.referenceRoles[i] ?? 'None') === 'Subject') return i;
  }
  return 1;
}

/** Subject and backdrop slots tied to the bake checklist cannot change role. */
export function isBakeChecklistReferenceSlot(shot: Shot | undefined, index: number): boolean {
  if (!shot || !isBakeStartFrame(shot)) return false;
  if (index === getBackdropSlotIndex(shot)) return true;
  return index === subjectSlotIndex(shot);
}

function slotHasImage(
  shot: Shot,
  index: number,
  lighting?: LightingSettings,
): boolean {
  const url = effectiveReferenceUrl(shot, index, lighting ?? shot.lighting);
  return Boolean(url ?? shot.references[index]);
}

export function getWorkflowReferenceSteps(
  shot: Shot | undefined,
  lighting?: LightingSettings,
  aspectRatio: AspectRatio = '16:9',
): WorkflowReferenceStep[] {
  if (!shot || !isBakeStartFrame(shot)) return [];

  const backdropIdx = getBackdropSlotIndex(shot);
  const backdropReady = backdropIdx >= 0 && slotHasImage(shot, backdropIdx, lighting);
  const bakeStatus: BakeStatus = shot.bakeStatus ?? 'idle';
  const requiredSheets = getRequiredSubjectSheetCount(shot);
  const sheetsLabel =
    requiredSheets > 1 ? `Character Sheets (${requiredSheets})` : 'Character Sheet';

  return [
    {
      id: 'character-sheet',
      label: sheetsLabel,
      done: areCharacterSheetsComplete(shot, lighting),
    },
    {
      id: 'backdrop',
      label: 'Backdrop',
      done: backdropReady,
    },
    {
      id: 'lock-backdrop',
      label: 'Lock Backdrop',
      done: backdropReady && isBackdropCropCommitted(shot, aspectRatio),
    },
    {
      id: 'place-mannequins',
      label: 'Place Mannequins',
      done: getPrincipalMannequins(shot.mannequins).length > 0,
    },
    {
      id: 'assign-characters',
      label: 'Assign Characters',
      done: isCharacterAssignmentComplete(shot, lighting),
    },
    {
      id: 'bake',
      label: 'Bake',
      done: bakeStatus === 'ready' && Boolean(shot.bakedStartFrame),
    },
  ];
}

export function shouldInjectFieldSizePrompt(shot: Shot | undefined): boolean {
  return !isBakeStartFrame(shot);
}

export function hasBakedStartFrame(shot: Shot | undefined): boolean {
  return Boolean(shot?.bakedStartFrame && shot.bakeStatus === 'ready');
}

/** Lock-start video should use the baked pixels only — not auto-place refs or scene-rebuild prompts. */
export function shouldUseBakedStartFrameForVideo(shot: Shot | undefined): boolean {
  return isBakeStartFrame(shot) && hasBakedStartFrame(shot);
}

export { canAddMannequin, createDefaultMannequin, getMannequinLimit } from '@/lib/studio/mannequin-factory';

/** Default mannequin layout from camera subject count, field size, and placement grid. */
export function seedMannequinsForShot(shot: Shot): Mannequin[] {
  return syncMannequinsFromShot(shot, undefined, { reason: 'seed' });
}

export function finalizeMannequinsForShot(shot: Shot, mannequins: Mannequin[]): Mannequin[] {
  const sanitized = sanitizeMannequinSubjectSlots(shot, mannequins);
  return tryAutoAssignSingleSubject(shot, sanitized);
}

export function getSubjectSheetUrl(shot: Shot | undefined, lighting?: LightingSettings): string | null {
  if (!shot) return null;
  const idx = subjectSlotIndex(shot);
  const url = effectiveReferenceUrl(shot, idx, lighting ?? shot.lighting) ?? shot.references[idx];
  return url ?? getSubjectReference(shot) ?? null;
}

/** Video/API refs when lock-start-frame bake is ready — baked frame only (identity is already in pixels). */
export function buildWorkflowGenerationRefs(
  shot: Shot | undefined,
  _lighting?: LightingSettings,
  _aspectRatio?: AspectRatio,
): Array<{ role: ReferenceRole; url: string; slotIndex: number }> | null {
  if (!shouldUseBakedStartFrameForVideo(shot) || !shot?.bakedStartFrame) return null;

  return [{ role: 'Backdrop', url: shot.bakedStartFrame, slotIndex: 0 }];
}