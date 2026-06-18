import type { HumanoidFigure } from '@/lib/studio/humanoid/types';

const DEG = Math.PI / 180;

function resetPose(figure: HumanoidFigure) {
  const { bones } = figure.userData;
  if (!bones) return;
  for (const bone of Object.values(bones)) {
    bone.rotation.set(0, 0, 0);
  }
  figure.rotation.set(0, 0, 0);
}

export function applyNeutralPose(figure: HumanoidFigure) {
  resetPose(figure);
  const { bones } = figure.userData;
  if (!bones) return;

  figure.rotation.y = -90 * DEG;
  bones.Spine.rotation.x = 2 * DEG;
  bones.Neck.rotation.x = -8 * DEG;
  bones.LeftArm.rotation.z = -8 * DEG;
  bones.RightArm.rotation.z = 8 * DEG;
  bones.LeftForeArm.rotation.x = -18 * DEG;
  bones.RightForeArm.rotation.x = -18 * DEG;
}

export function applyTalkingPose(figure: HumanoidFigure, time: number) {
  applyNeutralPose(figure);
  const { bones } = figure.userData;
  if (!bones) return;
  bones.Neck.rotation.x += Math.sin(time * 4) * 4 * DEG;
}

export function applyWalkingPose(figure: HumanoidFigure, time: number) {
  applyNeutralPose(figure);
  const { bones } = figure.userData;
  if (!bones) return;
  const swing = Math.sin(time * 3) * 12;
  bones.LeftArm.rotation.z = (-8 + swing) * DEG;
  bones.RightArm.rotation.z = (-8 - swing) * DEG;
  bones.LeftUpLeg.rotation.x = swing * 0.4 * DEG;
  bones.RightUpLeg.rotation.x = -swing * 0.4 * DEG;
}