import { PLACEMENT_POSITIONS } from '@/lib/constants/camera';
import { FIELD_SIZE_HEIGHT_PCT } from '@/lib/constants/framing';
import { getFigureCount } from '@/lib/studio/blocking-layout';
import { getShotFrameComposition } from '@/lib/studio/composition';
import { createDefaultMannequin, getMannequinLimit } from '@/lib/studio/mannequin-factory';
import { defaultFeetAnchorY } from '@/lib/studio/mannequin-layout';
import {
  sanitizeMannequinSubjectSlots,
  tryAutoAssignSingleSubject,
} from '@/lib/studio/mannequin-character-assignment';
import type { Mannequin, MannequinAngle, Shot } from '@/lib/types/studio';

export type MannequinSyncReason = 'seed' | 'camera' | 'placement';

function finalizeMannequins(shot: Shot, mannequins: Mannequin[]): Mannequin[] {
  const sanitized = sanitizeMannequinSubjectSlots(shot, mannequins);
  return tryAutoAssignSingleSubject(shot, sanitized);
}

function fieldScaleForShot(shot: Shot): number {
  return (
    (FIELD_SIZE_HEIGHT_PCT[shot.camera.fieldSize] ?? FIELD_SIZE_HEIGHT_PCT.ms) /
    FIELD_SIZE_HEIGHT_PCT.ms
  );
}

function layoutAnchor(shot: Shot): { anchorX: number; feetY: number; fieldScale: number } {
  const frame = getShotFrameComposition(shot);
  const placement = PLACEMENT_POSITIONS[frame.placement] ?? PLACEMENT_POSITIONS['cell-1-1'];
  return {
    anchorX: placement.x / 100,
    feetY: defaultFeetAnchorY(shot.camera.fieldSize, frame.headroom),
    fieldScale: fieldScaleForShot(shot),
  };
}

function pctX(value: number): number {
  return value / 100;
}

function pctY(value: number): number {
  return value / 100;
}

function buildDefaultMannequins(shot: Shot): Mannequin[] {
  const { camera } = shot;
  const count = getMannequinLimit(shot);
  const figureCount = getFigureCount(camera);
  const { anchorX, feetY, fieldScale } = layoutAnchor(shot);
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

/** Build or refresh mannequin layout from shot camera + composition. PR2 adds smart resync on camera changes. */
export function syncMannequinsFromShot(
  shot: Shot,
  prevMannequins?: Mannequin[],
  options?: { reason?: MannequinSyncReason },
): Mannequin[] {
  const reason = options?.reason ?? 'seed';
  const existing = prevMannequins ?? shot.mannequins ?? [];

  if (reason !== 'seed' && existing.length > 0) {
    return finalizeMannequins(shot, existing);
  }

  if (existing.length > 0 && reason === 'seed') {
    return finalizeMannequins(shot, existing);
  }

  return finalizeMannequins(shot, buildDefaultMannequins(shot));
}

/** Ensure shot has mannequins — seeds when empty, otherwise sanitizes assignments. */
export function ensureMannequinsOnShot(shot: Shot): Mannequin[] {
  const existing = shot.mannequins ?? [];
  if (existing.length > 0) {
    return finalizeMannequins(shot, existing);
  }
  return syncMannequinsFromShot(shot, undefined, { reason: 'seed' });
}