import {
  clearBackdropCrops,
  clearBackdropCropStatus,
  getBackdropSlotIndex,
} from '@/lib/studio/backdrop-framing';
import { mannequinLayoutInvalidationPatch } from '@/lib/studio/mannequin-sync';
import { isBakeStartFrame } from '@/lib/studio/workflow';
import type { Shot, Workflow } from '@/lib/types/studio';

export type InvalidationCause =
  | { kind: 'reference_cleared'; slotIndex: number }
  | { kind: 'reference_set'; slotIndex: number; hadImage: boolean }
  | { kind: 'mannequin_layout_changed' }
  | { kind: 'character_assignment_changed' }
  | { kind: 'manual_invalidate_bake' }
  | { kind: 'workflow_changed'; from: Workflow; to: Workflow };

export type InvalidationPatch = Partial<Shot> & { toast?: string };

function isBackdropSlot(shot: Shot, slotIndex: number): boolean {
  return slotIndex === getBackdropSlotIndex(shot);
}

function backdropCropClearPatch(shot: Shot): Partial<Shot> {
  return {
    backdropCropsByAspect: clearBackdropCrops(shot.backdropCropsByAspect),
    backdropCropStatusByAspect: clearBackdropCropStatus(shot.backdropCropStatusByAspect),
  };
}

function backdropReferenceClearPatch(shot: Shot): Partial<Shot> {
  return {
    ...backdropCropClearPatch(shot),
    backdropFramingByAspect: {},
  };
}

export function resolveReferenceSlotInvalidation(
  shot: Shot,
  slotIndex: number,
  opts: { clearing: boolean; hadImage: boolean },
): InvalidationPatch {
  const isBackdrop = isBackdropSlot(shot, slotIndex);
  if (isBakeStartFrame(shot)) {
    return resolveWorkflowInvalidation(
      shot,
      opts.clearing
        ? { kind: 'reference_cleared', slotIndex }
        : { kind: 'reference_set', slotIndex, hadImage: opts.hadImage },
    );
  }
  if (!isBackdrop) return {};
  return opts.clearing ? backdropReferenceClearPatch(shot) : backdropCropClearPatch(shot);
}

function bakeReferenceChangePatch(shot: Shot): Partial<Shot> {
  return mannequinLayoutInvalidationPatch();
}

function bakeLayoutInvalidationPatch(shot: Shot, cause: InvalidationCause): InvalidationPatch {
  if (shot.bakeStatus !== 'ready' || !shot.bakedStartFrame) return {};
  return {
    ...mannequinLayoutInvalidationPatch(),
    ...(cause.kind === 'manual_invalidate_bake' ? { toast: 'Baked frame invalidated' } : {}),
  };
}

function resolveBakeStartFrameInvalidation(
  shot: Shot,
  cause: InvalidationCause,
): InvalidationPatch {
  switch (cause.kind) {
    case 'reference_cleared': {
      const patch: InvalidationPatch = bakeReferenceChangePatch(shot);
      if (isBackdropSlot(shot, cause.slotIndex)) {
        Object.assign(patch, backdropReferenceClearPatch(shot));
      }
      return patch;
    }
    case 'reference_set': {
      const patch: InvalidationPatch = bakeReferenceChangePatch(shot);
      if (isBackdropSlot(shot, cause.slotIndex)) {
        Object.assign(patch, backdropCropClearPatch(shot));
      }
      return patch;
    }
    case 'mannequin_layout_changed':
    case 'character_assignment_changed':
      return bakeLayoutInvalidationPatch(shot, cause);
    case 'manual_invalidate_bake':
      return bakeLayoutInvalidationPatch(shot, cause);
    case 'workflow_changed':
      return cause.to === 'bake-start-frame'
        ? {}
        : bakeReferenceChangePatch(shot);
    default:
      return {};
  }
}

export function resolveWorkflowInvalidation(
  shot: Shot,
  cause: InvalidationCause,
): InvalidationPatch {
  if (!isBakeStartFrame(shot)) return {};
  return resolveBakeStartFrameInvalidation(shot, cause);
}

export function splitInvalidationPatch(
  patch: InvalidationPatch,
): { shotPatch: Partial<Shot>; toast?: string } {
  const { toast, ...shotPatch } = patch;
  return { shotPatch, toast };
}
