import { PLACEMENT_POSITIONS } from '@/lib/constants/camera';
import { mannequinVariantFrom } from '@/lib/constants/mannequin-assets';
import { fieldSizeAnchor } from '@/lib/studio/mannequin-bounds-framing';
import { getFigureCount } from '@/lib/studio/blocking-layout';
import { getShotFrameComposition } from '@/lib/studio/composition';
import { migrateMannequins } from '@/lib/studio/migrate-mannequin';
import { createDefaultMannequin, getMannequinLimit } from '@/lib/studio/mannequin-factory';
import {
  sanitizeMannequinSubjectSlots,
  tryAutoAssignSingleSubject,
} from '@/lib/studio/mannequin-character-assignment';
import type { AspectRatio, Mannequin, MannequinAngle, Shot } from '@/lib/types/studio';

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
  const frame = getShotFrameComposition(shot);
  const placement = PLACEMENT_POSITIONS[frame.placement] ?? PLACEMENT_POSITIONS['cell-1-1'];
  return placement.x / 100;
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

function pctX(value: number): number {
  return value / 100;
}

function pctY(value: number): number {
  return value / 100;
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

  if (camera.coverage === 'pov' && count <= 1) {
    return [];
  }

  if (count === 1 && camera.coverage !== 'dirty-single') {
    return [createDefaultMannequin({ x: anchorX, y: feetY, scale })];
  }

  if (count === 2 && camera.subjectCount === '1s' && camera.coverage === 'dirty-single') {
    return [
      createDefaultMannequin({ x: anchorX, y: feetY, scale }),
      createDefaultMannequin({
        x: Math.min(0.92, anchorX + 0.18),
        y: feetY,
        scale: scale * 1.1,
        opacity: 0.3,
        angle: 'threeQuarterLeft',
        rotation: -15,
      }),
    ];
  }

  if (count === 2) {
    if (camera.coverage === 'ots') {
      return [
        createDefaultMannequin({
          x: pctX(18),
          y: feetY,
          scale: scale * 1.35,
          rotation: -25,
          angle: 'threeQuarterRight',
        }),
        createDefaultMannequin({
          x: anchorX,
          y: feetY,
          scale: scale * 0.9,
          rotation: 15,
          angle: 'threeQuarterLeft',
        }),
      ];
    }

    if (camera.coverage === 'one-half') {
      return [
        createDefaultMannequin({ x: anchorX, y: pctY(feetY * 100 - 2), scale }),
        createDefaultMannequin({
          x: anchorX,
          y: pctY(feetY * 100 + 14),
          scale: scale * 0.92,
        }),
      ];
    }

    return [
      createDefaultMannequin({
        x: anchorX - 0.12,
        y: feetY,
        scale,
        rotation: -12,
        angle: 'threeQuarterRight',
      }),
      createDefaultMannequin({
        x: anchorX + 0.12,
        y: feetY,
        scale,
        rotation: 12,
        angle: 'threeQuarterLeft',
      }),
    ];
  }

  if (count === 3) {
    return [
      createDefaultMannequin({ x: anchorX - 0.14, y: feetY, scale, rotation: -12 }),
      createDefaultMannequin({ x: anchorX, y: feetY, scale }),
      createDefaultMannequin({ x: anchorX + 0.14, y: feetY, scale, rotation: 12 }),
    ];
  }

  const cols = isCrowd ? 5 : count;
  const spacing = isCrowd ? 9 : 11;
  const anchorPctX = anchorX * 100;
  const feetPctY = feetY * 100;
  const startX = anchorPctX - ((cols - 1) * spacing) / 2;
  const mannequins: Mannequin[] = [];

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    mannequins.push(
      createDefaultMannequin({
        x: pctX(startX + col * spacing),
        y: pctY(feetPctY + row * 8),
        scale,
        rotation: 0,
        angle: (isCrowd ? 'threeQuarterLeft' : 'front') as MannequinAngle,
      }),
    );
  }

  return mannequins;
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
  const coverageChanged = prevShot.camera.coverage !== shot.camera.coverage;
  const subjectCountChanged = prevShot.camera.subjectCount !== shot.camera.subjectCount;
  const fieldSizeChanged = prevShot.camera.fieldSize !== shot.camera.fieldSize;
  const placementChanged =
    reason === 'placement' ||
    prevShot.frameComposition.placement !== shot.frameComposition.placement ||
    prevShot.frameComposition.headroom !== shot.frameComposition.headroom ||
    prevShot.frameComposition.guide !== shot.frameComposition.guide;

  const forceLayoutCount =
    countChanged || coverageChanged || subjectCountChanged;
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

    if (countChanged || coverageChanged || subjectCountChanged) {
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
  'bakedStartFrame' | 'bakeStatus' | 'previewFrameFingerprint'
> {
  return {
    bakedStartFrame: null,
    bakeStatus: 'idle',
    previewFrameFingerprint: null,
  };
}