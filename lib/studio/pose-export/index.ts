import * as THREE from 'three';
import { BONE_NAMES, type BoneMap } from '@/lib/studio/humanoid/types';

/** MediaPipe Pose landmark indices mapped to Mixamo bone names */
export const MEDIAPIPE_BONE_MAP: Record<number, keyof BoneMap> = {
  11: 'LeftShoulder',
  12: 'RightShoulder',
  13: 'LeftArm',
  14: 'RightArm',
  15: 'LeftForeArm',
  16: 'RightForeArm',
  23: 'LeftUpLeg',
  24: 'RightUpLeg',
  25: 'LeftLeg',
  26: 'RightLeg',
  27: 'LeftFoot',
  28: 'RightFoot',
};

export interface PoseLandmark {
  id: number;
  x: number;
  y: number;
  z: number;
}

export function boneWorldPosition(bone: THREE.Object3D): THREE.Vector3 {
  const pos = new THREE.Vector3();
  bone.getWorldPosition(pos);
  return pos;
}

/** Project skeleton to normalized 2D landmarks for AI backends */
export function toMediaPipeLandmarks(
  bones: BoneMap,
  camera: THREE.Camera,
  width: number,
  height: number,
): PoseLandmark[] {
  const landmarks: PoseLandmark[] = [];
  const projected = new THREE.Vector3();

  for (const [indexStr, boneName] of Object.entries(MEDIAPIPE_BONE_MAP)) {
    const bone = bones[boneName];
    if (!bone) continue;
    const world = boneWorldPosition(bone);
    projected.copy(world).project(camera);
    landmarks.push({
      id: Number(indexStr),
      x: (projected.x + 1) / 2,
      y: (1 - projected.y) / 2,
      z: projected.z,
    });
  }

  return landmarks;
}

/** OpenPose-style body keypoints (simplified COCO-18 subset from rig bones) */
export function toOpenPoseKeypoints(bones: BoneMap): Record<string, [number, number, number]> {
  const result: Record<string, [number, number, number]> = {};
  for (const name of BONE_NAMES) {
    const bone = bones[name];
    if (!bone) continue;
    const p = boneWorldPosition(bone);
    result[name] = [p.x, p.y, p.z];
  }
  return result;
}