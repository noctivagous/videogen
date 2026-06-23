/**
 * Adapter between VideoGen's `Mannequin` type and PoseBlock's `PoseBlockInstance`.
 *
 * Coordinate conventions are identical (feet-anchor x/y/scale, rotation degrees),
 * so the translation is mostly about model URL resolution and enum mapping.
 */

import type { Mannequin, MannequinAngle, MannequinGender, MannequinPose } from '@/lib/types/studio';

// ---------------------------------------------------------------------------
// PoseBlockInstance shape — mirrors PoseBlock/types.ts without importing it
// so VideoGen's tsc does not follow into the submodule.
// ---------------------------------------------------------------------------

export interface PoseBlockInstance {
  id: string;
  modelUrl: string;
  basePoseId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  characterZ?: number;
  characterRotationX?: number;
  characterRotationY?: number;
}

// ---------------------------------------------------------------------------
// Model URL resolution
// ---------------------------------------------------------------------------

/** GLB assets served from PoseBlock's /public/models directory. */
const MODEL_URLS: Record<MannequinGender, string> = {
  male: '/models/X Bot.glb',
  female: '/models/Y Bot.glb',
};

export function modelUrlForMannequin(gender: MannequinGender): string {
  return MODEL_URLS[gender] ?? MODEL_URLS.male;
}

// ---------------------------------------------------------------------------
// Pose mapping
// ---------------------------------------------------------------------------

const POSE_TO_BASE_POSE_ID: Record<MannequinPose, string> = {
  standard: 'a_pose',
  walking: 'walking',
  seated: 'seated',
};

export function basePoseIdForMannequin(pose: MannequinPose): string {
  return POSE_TO_BASE_POSE_ID[pose] ?? 'a_pose';
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
  return {
    id: m.id,
    modelUrl: modelUrlForMannequin(m.gender),
    basePoseId: basePoseIdForMannequin(m.pose),
    x: m.x,
    y: m.y,
    scale: m.scale,
    rotation: m.rotation,
    characterZ: 0,
    characterRotationX: 0,
    characterRotationY: rotationYForAngle(m.angle),
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
  if (patch.rotation !== undefined) result.rotation = patch.rotation;

  if (patch.characterRotationY !== undefined) {
    result.angle = angleForRotationY(patch.characterRotationY);
  }

  return result;
}
