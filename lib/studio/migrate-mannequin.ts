import { DEFAULT_POSEBLOCK_BASE_POSE_ID } from '@/lib/poseblock/posePresets';
import { normalizeYawTurn16 } from '@/lib/studio/mannequin-rotation';
import type { Mannequin, MannequinAge } from '@/lib/types/studio';

export function migrateMannequin(raw: Mannequin): Mannequin {
  let age: MannequinAge = raw.age ?? 'adult';
  if (!raw.age && raw.ageScale != null) {
    if (raw.ageScale <= 0.8) age = 'child';
    else if (raw.ageScale < 1) age = 'teen';
  }
  const migrated: Mannequin = {
    ...raw,
    gender: raw.gender ?? 'male',
    age,
    pose: raw.pose ?? 'standard',
    poseBlockBasePoseId: raw.poseBlockBasePoseId ?? DEFAULT_POSEBLOCK_BASE_POSE_ID,
    yawTurn16: normalizeYawTurn16(raw.yawTurn16, raw.angle ?? 'front'),
    pitchDeg: Number.isFinite(raw.pitchDeg) ? raw.pitchDeg : 0,
  };
  if (
    raw.subjectSlotIndex != null &&
    Number.isInteger(raw.subjectSlotIndex) &&
    raw.subjectSlotIndex >= 0
  ) {
    migrated.subjectSlotIndex = raw.subjectSlotIndex;
  }
  return migrated;
}

export function migrateMannequins(mannequins: Mannequin[] | undefined): Mannequin[] {
  return (mannequins ?? []).map(migrateMannequin);
}