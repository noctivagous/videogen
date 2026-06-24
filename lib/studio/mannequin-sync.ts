import { mannequinVariantFrom } from '@/lib/constants/mannequin-assets';
import { fieldSizeAnchor } from '@/lib/studio/mannequin-bounds-framing';
import { getFigureCount } from '@/lib/studio/blocking-layout';
import { migrateMannequins } from '@/lib/studio/migrate-mannequin';
import { createDefaultMannequin, getMannequinLimit } from '@/lib/studio/mannequin-factory';
import { layoutFromCamera } from '@/lib/studio/mannequin-layouts';
import {
  sanitizeMannequinSubjectSlots,
  tryAutoAssignSingleSubject,
} from '@/lib/studio/mannequin-character-assignment';
import type { AspectRatio, Mannequin, Shot } from '@/lib/types/studio';

export type MannequinSyncReason = 'seed' | 'camera' | 'placement';

/** Normalized distance below which a mannequin is treated as auto-placed (not manually dragged). */
export const MANUAL_POSITION_THRESHOLD = 0.05;

export interface MannequinSyncOptions {
  reason?: MannequinSyncReason;
  /** Shot state before the camera/composition change — required for smart resync. */
  prevShot?: Shot;
  aspectRatio?: AspectRatio;
}

function finalizeMannequins(shot: Shot, mannequins: Mannequin[]): Mannequin[] {
  const sanitized = sanitizeMannequinSubjectSlots(shot, mannequins);
  return tryAutoAssignSingleSubject(shot, sanitized);
}

export function placementAnchorX(shot: Shot): number {
  void shot;
  // Placement guides are preview-only overlays and no longer drive mannequin/object layout.
  return 0.5;
}

export function mannequinFieldSizeAnchor(
  shot: Shot,
  mannequin: Pick<Mannequin, 'gender' | 'age' | 'pose' | 'angle'>,
  aspectRatio: AspectRatio = '16:9',
): { x: number; y: number; scale: number } {
  const frame = getShotFrameComposition(shot);
  return fieldSizeAnchor(
    shot.camera.fieldSize,
    frame.headroom,
    placementAnchorX(shot),
    aspectRatio,
    mannequinVariantFrom(mannequin),
  );
}

/** Feet anchor + field scale from placement grid, headroom, and relational bounds framing. */
export function getLayoutAnchor(
  shot: Shot,
  aspectRatio: AspectRatio = '16:9',
): { anchorX: number; feetY: number; fieldScale: number } {
  const anchor = mannequinFieldSizeAnchor(
    shot,
    { gender: 'male', age: 'adult', pose: 'standard', angle: 'front' },
    aspectRatio,
  );
  return {
    anchorX: anchor.x,
    feetY: anchor.y,
    fieldScale: anchor.scale,
  };
}

export function buildDefaultMannequins(
  shot: Shot,
  aspectRatio: AspectRatio = '16:9',
): Mannequin[] {
  const { camera } = shot;
  const count = getMannequinLimit(shot);
  const figureCount = getFigureCount(camera);
  const { anchorX, feetY, fieldScale } = getLayoutAnchor(shot, aspectRatio);
  const isCrowd = figureCount >= 10;
  const groupScale = isCrowd ? 0.85 : 1;
  const scale = fieldScale * groupScale;

  return layoutFromCamera(camera, { anchorX, feetY, scale }, count);
}

export function isNearLayoutDefault(mannequin: Mannequin, layoutDefault: Mannequin): boolean {
  const dx = mannequin.x - layoutDefault.x;
  const dy = mannequin.y - layoutDefault.y;
  const dr = Math.abs((mannequin.rotation ?? 0) - (layoutDefault.rotation ?? 0));
  return Math.hypot(dx, dy) < MANUAL_POSITION_THRESHOLD && dr < 10;
}

function sortByX(mannequins: Mannequin[]): Mannequin[] {
  return [...mannequins].sort((a, b) => a.x - b.x);
}

function layoutDrivingFieldsChanged(prevShot: Shot, shot: Shot): boolean {
  const prev = prevShot.camera;
  const next = shot.camera;
  return (
    prev.subjectCount !== next.subjectCount ||
    prev.coverage !== next.coverage ||
    prev.arrangement !== next.arrangement ||
    prev.crowdDensity !== next.crowdDensity ||
    prev.fillRestWithGenerics !== next.fillRestWithGenerics
  );
}

function smartResyncMannequins(
  shot: Shot,
  existing: Mannequin[],
  prevShot: Shot,
  reason: MannequinSyncReason,
  aspectRatio: AspectRatio = '16:9',
): Mannequin[] {
  const targetDefaults = buildDefaultMannequins(shot, aspectRatio);
  const oldDefaults = buildDefaultMannequins(prevShot, aspectRatio);
  const sortedExisting = sortByX(migrateMannequins(existing));

  const countChanged = getMannequinLimit(prevShot) !== getMannequinLimit(shot);
  const layoutChanged = layoutDrivingFieldsChanged(prevShot, shot);
  const fieldSizeChanged = prevShot.camera.fieldSize !== shot.camera.fieldSize;
  const placementChanged =
    reason === 'placement' ||
    prevShot.frameComposition.placement !== shot.frameComposition.placement ||
    prevShot.frameComposition.headroom !== shot.frameComposition.headroom ||
    prevShot.frameComposition.guide !== shot.frameComposition.guide;

  const forceLayoutCount = countChanged || layoutChanged;
  const layoutCount = forceLayoutCount ? targetDefaults.length : sortedExisting.length;

  const merged: Mannequin[] = [];

  for (let i = 0; i < layoutCount; i++) {
    const def = targetDefaults[Math.min(i, targetDefaults.length - 1)]!;
    const oldDef = oldDefaults[i] ?? oldDefaults[oldDefaults.length - 1] ?? def;
    const prev = sortedExisting[i];

    if (!prev) {
      merged.push(def);
      continue;
    }

    const nearDefault = isNearLayoutDefault(prev, oldDef);

    let next: Mannequin = {
      ...def,
      id: prev.id,
      subjectSlotIndex: prev.subjectSlotIndex,
      gender: prev.gender,
      age: prev.age,
      pose: prev.pose,
      opacity: prev.opacity,
      x: prev.x,
      y: prev.y,
      scale: prev.scale,
      rotation: prev.rotation,
      angle: prev.angle,
    };

    if (countChanged || layoutChanged) {
      if (nearDefault) {
        next = {
          ...def,
          id: prev.id,
          subjectSlotIndex: prev.subjectSlotIndex,
          gender: prev.gender,
          age: prev.age,
          pose: prev.pose,
        };
      } else if (fieldSizeChanged) {
        const variantAnchor = mannequinFieldSizeAnchor(shot, prev, aspectRatio);
        next.x = variantAnchor.x;
        next.y = variantAnchor.y;
        next.scale = variantAnchor.scale;
      }
    } else if (fieldSizeChanged) {
      const variantAnchor = mannequinFieldSizeAnchor(shot, prev, aspectRatio);
      next.x = variantAnchor.x;
      next.y = variantAnchor.y;
      next.scale = variantAnchor.scale;
      if (nearDefault) {
        next.rotation = def.rotation;
        next.angle = def.angle;
      }
    } else if (placementChanged && (reason === 'placement' || nearDefault)) {
      next.x = def.x;
      next.y = def.y;
      next.rotation = def.rotation;
      next.angle = def.angle;
      if (reason === 'placement') {
        next.scale = def.scale;
      }
    }

    merged.push(next);
  }

  return merged;
}

/** Build or refresh mannequin layout from shot camera + composition. */
export function syncMannequinsFromShot(
  shot: Shot,
  prevMannequins?: Mannequin[],
  options?: MannequinSyncOptions,
): Mannequin[] {
  const reason = options?.reason ?? 'seed';
  const aspectRatio = options?.aspectRatio ?? '16:9';
  const existing = migrateMannequins(prevMannequins ?? shot.mannequins ?? []);

  if (reason === 'seed') {
    if (existing.length > 0) return finalizeMannequins(shot, existing);
    return finalizeMannequins(shot, buildDefaultMannequins(shot, aspectRatio));
  }

  if (existing.length === 0) {
    return finalizeMannequins(shot, buildDefaultMannequins(shot, aspectRatio));
  }

  const prevShot = options?.prevShot;
  if (!prevShot) {
    return finalizeMannequins(shot, existing);
  }

  const resynced = smartResyncMannequins(shot, existing, prevShot, reason, aspectRatio);
  return finalizeMannequins(shot, resynced);
}

/** Ensure shot has mannequins — seeds when empty, otherwise sanitizes assignments. */
export function ensureMannequinsOnShot(shot: Shot): Mannequin[] {
  const existing = shot.mannequins ?? [];
  if (existing.length > 0) {
    return finalizeMannequins(shot, existing);
  }
  return syncMannequinsFromShot(shot, undefined, { reason: 'seed' });
}

export function mannequinLayoutInvalidationPatch(): Pick<
  Shot,
  'bakedStartFrame' | 'bakedIntermediateFrame' | 'bakeStatus' | 'previewFrameFingerprint'
> {
  return {
    bakedStartFrame: null,
    bakedIntermediateFrame: null,
    bakeStatus: 'idle',
    previewFrameFingerprint: null,
  };
}
