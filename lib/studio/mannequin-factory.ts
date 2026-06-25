import { getPrincipalMannequins } from '@/lib/studio/mannequin-character-assignment';
import { defaultFeetAnchorY } from '@/lib/studio/mannequin-layout';
import { MAX_PRINCIPAL_MANNEQUINS } from '@/lib/studio/subject-count-from-mannequins';
import { DEFAULT_POSEBLOCK_BASE_POSE_ID } from '@/lib/poseblock/posePresets';
import { angleToYawTurn16 } from '@/lib/studio/mannequin-rotation';
import type { Mannequin, MannequinAngle, Shot } from '@/lib/types/studio';

function newMannequinId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mannequin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultMannequin(
  partial: Partial<Mannequin> & { angle?: MannequinAngle } = {},
): Mannequin {
  return {
    id: partial.id ?? newMannequinId(),
    angle: partial.angle ?? 'front',
    gender: partial.gender ?? 'male',
    age: partial.age ?? 'adult',
    pose: partial.pose ?? 'standard',
    poseBlockBasePoseId: partial.poseBlockBasePoseId ?? DEFAULT_POSEBLOCK_BASE_POSE_ID,
    x: partial.x ?? 0.5,
    y: partial.y ?? defaultFeetAnchorY('ms'),
    scale: partial.scale ?? 1,
    yawTurn16: partial.yawTurn16 ?? angleToYawTurn16(partial.angle ?? 'front'),
    pitchDeg: partial.pitchDeg ?? 0,
    rollDeg: partial.rollDeg ?? 0,
    rotation: partial.rotation ?? 0,
    opacity: partial.opacity ?? 1,
  };
}

export function getMannequinLimit(shot: Shot | undefined): number {
  if (!shot) return 1;
  if (shot.camera.subjectCount === '1s' && shot.camera.coverage === 'dirty-single') {
    return 2;
  }
  switch (shot.camera.subjectCount) {
    case '2s':
      return 2;
    case '3s':
      return 3;
    case 'group':
      return 5;
    case 'crowd':
      return 10;
    default:
      return 1;
  }
}

export function canAddMannequin(shot: Shot | undefined): boolean {
  if (!shot) return false;
  const principalCount = getPrincipalMannequins(shot.mannequins).length;
  if (principalCount >= MAX_PRINCIPAL_MANNEQUINS) return false;
  return (shot.mannequins?.length ?? 0) < MAX_PRINCIPAL_MANNEQUINS;
}