/**
 * Adapter between VideoGen's `Mannequin` type and PoseBlock's `PoseBlockInstance`.
 *
 * Coordinate conventions are identical (feet-anchor x/y/scale, rotation degrees),
 * so the translation is mostly about model URL resolution and enum mapping.
 */

import { DEFAULT_POSEBLOCK_BASE_POSE_ID } from '@/lib/poseblock/posePresets';
import {
  angleToYawTurn16,
  normalizeYawTurn16,
  yawTurn16ToAngle,
} from '@/lib/studio/mannequin-rotation';
import type { Mannequin, MannequinAngle, MannequinGender, MannequinPose } from '@/lib/types/studio';

// ---------------------------------------------------------------------------
// PoseBlockInstance shape — mirrors PoseBlock/types.ts without importing it
// so VideoGen's tsc does not follow into the submodule.
// ---------------------------------------------------------------------------

export interface PoseBlockInstance {
  id: string;
  modelUrl: string;
  basePoseId: string;
  poseAdjustments?: Array<{ type: string; [key: string]: unknown }>;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  characterZ?: number;
  characterRotationX?: number;
  characterRotationY?: number;
  characterRotationZ?: number;
}

// ---------------------------------------------------------------------------
// Model URL resolution
// ---------------------------------------------------------------------------

/** GLB assets — served from `public/poseblock-models` (symlink to PoseBlock/public/models). */
const POSEBLOCK_MODELS_BASE = '/poseblock-models';

/** PoseBlock GLB filenames are not gendered — X Bot = female, Y Bot = male. */
const MODEL_URLS: Record<MannequinGender, string> = {
  male: `${POSEBLOCK_MODELS_BASE}/Y Bot.glb`,
  female: `${POSEBLOCK_MODELS_BASE}/X Bot.glb`,
};

export function modelUrlForMannequin(gender: MannequinGender): string {
  return MODEL_URLS[gender] ?? MODEL_URLS.male;
}

// ---------------------------------------------------------------------------
// Pose mapping
// ---------------------------------------------------------------------------

const POSE_TO_BASE_POSE_ID: Record<MannequinPose, string> = {
  standard: DEFAULT_POSEBLOCK_BASE_POSE_ID,
  walking: DEFAULT_POSEBLOCK_BASE_POSE_ID,
  seated: DEFAULT_POSEBLOCK_BASE_POSE_ID,
};

export function basePoseIdForMannequin(pose: MannequinPose): string {
  return POSE_TO_BASE_POSE_ID[pose] ?? DEFAULT_POSEBLOCK_BASE_POSE_ID;
}

// ---------------------------------------------------------------------------
// Angle → characterRotationY (degrees, Y-up, positive = counter-clockwise)
// ---------------------------------------------------------------------------

const ANGLE_TO_ROTATION_Y: Record<MannequinAngle, number> = {
  front: 0,
  threeQuarterLeft: 45,
  left: 90,
  rearThreeQuarterLeft: 135,
  back: 180,
  rearThreeQuarterRight: -135,
  right: -90,
  threeQuarterRight: -45,
};

export function rotationYForAngle(angle: MannequinAngle): number {
  return ANGLE_TO_ROTATION_Y[angle] ?? 0;
}

function normalizeAngleDeg360(deg: number): number {
  let value = deg % 360;
  if (value < 0) value += 360;
  return value;
}

function yawTurn16ForRotationY(rotationY: number): number {
  const normalized = normalizeAngleDeg360(rotationY);
  return Math.round(normalized / 22.5) % 16;
}

function rotationYForYawTurn16(yawTurn16: number): number {
  return normalizeYawTurn16(yawTurn16, 'front') * 22.5;
}

const ROTATION_Y_TO_ANGLE: Array<[number, MannequinAngle]> = [
  [0, 'front'],
  [45, 'threeQuarterLeft'],
  [90, 'left'],
  [135, 'rearThreeQuarterLeft'],
  [180, 'back'],
  [-135, 'rearThreeQuarterRight'],
  [-90, 'right'],
  [-45, 'threeQuarterRight'],
];

function normalizeAngleDeg(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

export function angleForRotationY(rotationY: number): MannequinAngle {
  const norm = normalizeAngleDeg(rotationY);
  let best: MannequinAngle = 'front';
  let bestDelta = Infinity;
  for (const [candidate, angle] of ROTATION_Y_TO_ANGLE) {
    const delta = Math.abs(normalizeAngleDeg(norm - candidate));
    if (delta < bestDelta) {
      bestDelta = delta;
      best = angle;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Primary conversion: Mannequin → PoseBlockInstance
// ---------------------------------------------------------------------------

export function mannequinToInstance(m: Mannequin): PoseBlockInstance {
  const yawTurn16 = normalizeYawTurn16(m.yawTurn16, m.angle);
  return {
    id: m.id,
    modelUrl: modelUrlForMannequin(m.gender),
    basePoseId: m.poseBlockBasePoseId ?? basePoseIdForMannequin(m.pose),
    poseAdjustments: m.poseBlockPoseAdjustments,
    x: m.x,
    y: m.y,
    scale: m.scale,
    // PoseBlock's `rotation` is yaw; keep it in sync with characterRotationY.
    rotation: rotationYForYawTurn16(yawTurn16),
    characterZ: 0,
    characterRotationX: m.pitchDeg ?? 0,
    characterRotationY: rotationYForYawTurn16(yawTurn16),
    characterRotationZ: m.rollDeg ?? 0,
  };
}

export function mannequinsToInstances(mannequins: Mannequin[]): PoseBlockInstance[] {
  return mannequins.map(mannequinToInstance);
}

// ---------------------------------------------------------------------------
// Reverse: PoseBlockInstance patch → Partial<Mannequin>
// ---------------------------------------------------------------------------

export function instancePatchToMannequinPatch(
  patch: Partial<PoseBlockInstance>,
): Partial<Mannequin> {
  const result: Partial<Mannequin> = {};

  if (patch.x !== undefined) result.x = patch.x;
  if (patch.y !== undefined) result.y = patch.y;
  if (patch.scale !== undefined) result.scale = patch.scale;
  const yawSource =
    patch.characterRotationY !== undefined ? patch.characterRotationY : patch.rotation;
  if (yawSource !== undefined) {
    const nextYawTurn16 = yawTurn16ForRotationY(yawSource);
    result.yawTurn16 = nextYawTurn16;
    result.angle = yawTurn16ToAngle(nextYawTurn16);
  }

  if (patch.characterRotationX !== undefined) {
    result.pitchDeg = patch.characterRotationX;
  }

  if (patch.characterRotationZ !== undefined) {
    result.rollDeg = patch.characterRotationZ;
  }

  if (patch.basePoseId !== undefined) {
    result.poseBlockBasePoseId = patch.basePoseId;
  }

  if (patch.poseAdjustments !== undefined) {
    result.poseBlockPoseAdjustments = patch.poseAdjustments;
  }

  return result;
}
