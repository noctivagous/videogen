import type * as THREE from 'three';

/** Mixamo-compatible bone names for AI export mappers */
export const BONE_NAMES = [
  'Hips',
  'Spine',
  'Spine1',
  'Spine2',
  'Neck',
  'Head',
  'LeftShoulder',
  'LeftArm',
  'LeftForeArm',
  'LeftHand',
  'RightShoulder',
  'RightArm',
  'RightForeArm',
  'RightHand',
  'LeftUpLeg',
  'LeftLeg',
  'LeftFoot',
  'RightUpLeg',
  'RightLeg',
  'RightFoot',
] as const;

export type BoneName = (typeof BONE_NAMES)[number];

export type BoneMap = Record<BoneName, THREE.Object3D>;

export interface HumanoidConfig {
  height: number;
  skinColor: string;
  jointColor: string;
  isChild?: boolean;
}

export interface HumanoidFigure extends THREE.Group {
  userData: THREE.Group['userData'] & {
    targetHeight: number;
    bones: BoneMap;
    hideLegs?: boolean;
  };
}