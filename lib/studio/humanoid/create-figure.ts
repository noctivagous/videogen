import * as THREE from 'three';
import type { BoneMap, BoneName, HumanoidConfig, HumanoidFigure } from '@/lib/studio/humanoid/types';

const LIMB = new THREE.MeshStandardMaterial({ color: '#e8dcc8', roughness: 0.85 });
const JOINT = new THREE.MeshStandardMaterial({ color: '#c4a882', roughness: 0.9 });

function limb(radius: number, length: number, material: THREE.Material) {
  const geo = new THREE.CapsuleGeometry(radius, Math.max(length - radius * 2, 0.02), 4, 8);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.y = length / 2;
  return mesh;
}

function joint(radius: number, material: THREE.Material) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), material);
}

function addBone(
  parent: THREE.Object3D,
  name: BoneName,
  bones: BoneMap,
  yOffset = 0,
): THREE.Group {
  const bone = new THREE.Group();
  bone.name = name;
  bone.position.y = yOffset;
  parent.add(bone);
  bones[name] = bone;
  return bone;
}

export function createHumanoidFigure(config: HumanoidConfig): HumanoidFigure {
  const scale = config.height / 1.8;
  const s = (v: number) => v * scale;
  const skin = LIMB.clone();
  skin.color.set(config.skinColor);
  const jointMat = JOINT.clone();
  jointMat.color.set(config.jointColor);

  const root = new THREE.Group() as HumanoidFigure;
  root.name = 'Humanoid';
  root.userData.targetHeight = config.height;

  const bones = {} as BoneMap;
  root.userData.bones = bones;

  const hips = addBone(root, 'Hips', bones);
  hips.add(joint(s(0.11), jointMat));

  const spine = addBone(hips, 'Spine', bones, s(0.12));
  spine.add(limb(s(0.09), s(0.22), skin));

  const spine1 = addBone(spine, 'Spine1', bones, s(0.22));
  spine1.add(limb(s(0.1), s(0.24), skin));

  const spine2 = addBone(spine1, 'Spine2', bones, s(0.24));
  spine2.add(limb(s(0.11), s(0.26), skin));

  const neck = addBone(spine2, 'Neck', bones, s(0.26));
  neck.add(limb(s(0.05), s(0.08), skin));

  const head = addBone(neck, 'Head', bones, s(0.08));
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(s(0.13), 12, 12), skin);
  headMesh.position.y = s(0.13);
  head.add(headMesh);

  function armChain(side: 'Left' | 'Right', shoulderY: number) {
    const sign = side === 'Left' ? 1 : -1;
    const shoulder = addBone(spine2, `${side}Shoulder` as BoneName, bones, shoulderY);
    shoulder.position.x = sign * s(0.2);

    const upper = addBone(shoulder, `${side}Arm` as BoneName, bones);
    upper.add(limb(s(0.055), s(0.28), skin));

    const fore = addBone(upper, `${side}ForeArm` as BoneName, bones, s(0.28));
    fore.add(limb(s(0.045), s(0.26), skin));

    const hand = addBone(fore, `${side}Hand` as BoneName, bones, s(0.26));
    hand.add(joint(s(0.05), jointMat));
  }

  armChain('Left', s(0.22));
  armChain('Right', s(0.22));

  function legChain(side: 'Left' | 'Right') {
    const sign = side === 'Left' ? 1 : -1;
    const upper = addBone(hips, `${side}UpLeg` as BoneName, bones);
    upper.position.set(sign * s(0.1), -s(0.02), 0);
    upper.add(limb(s(0.07), s(0.42), skin));

    const lower = addBone(upper, `${side}Leg` as BoneName, bones, s(0.42));
    lower.add(limb(s(0.06), s(0.4), skin));

    const foot = addBone(lower, `${side}Foot` as BoneName, bones, s(0.4));
    const footMesh = new THREE.Mesh(new THREE.BoxGeometry(s(0.1), s(0.06), s(0.22)), skin);
    footMesh.position.set(0, s(0.03), s(0.05));
    foot.add(footMesh);
  }

  legChain('Left');
  legChain('Right');

  root.updateMatrixWorld(true);
  return root;
}

export function stepFigureOnGround(figure: HumanoidFigure, groundLevel = -0.7) {
  const box = new THREE.Box3().setFromObject(figure);
  figure.position.y = groundLevel - box.min.y;
  figure.updateMatrixWorld(true);
}

export function setLegsVisible(figure: HumanoidFigure, visible: boolean) {
  const { bones } = figure.userData;
  if (!bones) return;
  for (const side of ['Left', 'Right'] as const) {
    bones[`${side}UpLeg`].visible = visible;
    bones[`${side}Leg`].visible = visible;
    bones[`${side}Foot`].visible = visible;
  }
  figure.userData.hideLegs = !visible;
}