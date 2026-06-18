import type * as THREE from 'three';
import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { MANNEQUIN_GRAY_VARIANTS, MANNEQUIN_JOINT_GRAY } from '@/lib/constants/mannequin';
import { getFigureCount } from '@/lib/studio/blocking-layout';
import { getPlacementOffset } from '@/lib/studio/camera-mapper';
import { createHumanoidFigure, setLegsVisible, stepFigureOnGround } from '@/lib/studio/humanoid/create-figure';
import { applyNeutralPose, applyTalkingPose, applyWalkingPose } from '@/lib/studio/humanoid/poses';
import type { HumanoidFigure } from '@/lib/studio/humanoid/types';
import type { CameraSettings, ScenePreviewPayload } from '@/lib/types/studio';

export { getFigureCount };

const FIGURE_COLORS = [...MANNEQUIN_GRAY_VARIANTS];
const JOINT_COLOR = MANNEQUIN_JOINT_GRAY;

export function createFigure(index: number, total: number): HumanoidFigure {
  const isCrowd = total >= 10;
  const figure = createHumanoidFigure({
    height: isCrowd ? 1.05 : 1.8,
    skinColor: FIGURE_COLORS[index % FIGURE_COLORS.length],
    jointColor: JOINT_COLOR,
    isChild: isCrowd,
  });
  figure.userData.baseScale = 1;
  return figure;
}

function setFigureScale(figure: HumanoidFigure, multiplier = 1) {
  const base: number = figure.userData?.baseScale ?? 1;
  figure.scale.setScalar(base * multiplier);
}

export function layoutFigures(figures: HumanoidFigure[], payload: ScenePreviewPayload, animTime = 0) {
  const { camera, shot, motion } = payload;
  const frame = shot?.frameComposition || DEFAULT_FRAME_COMPOSITION;
  const placement = getPlacementOffset(frame);
  const count = figures.length;
  const action = motion?.subjectAction || 'still';

  figures.forEach((figure) => {
    figure.visible = true;
    setLegsVisible(figure, true);
    setFigureScale(figure, count >= 10 ? 0.85 : 1);

    if (action === 'talking') applyTalkingPose(figure, animTime);
    else if (action === 'walking' || action === 'running') applyWalkingPose(figure, animTime);
    else applyNeutralPose(figure);
  });

  if (camera.coverage === 'pov') {
    figures.forEach((f) => { f.visible = false; });
    return;
  }

  if (count === 1) {
    layoutSingle(figures[0], camera, placement);
    return;
  }

  if (count === 2) {
    layoutTwoShot(figures, camera, placement);
    return;
  }

  if (count === 3) {
    layoutThreeShot(figures, placement);
    return;
  }

  layoutGroup(figures, count, placement);
}

function layoutSingle(figure: HumanoidFigure, camera: CameraSettings, placement: { x: number; z: number }) {
  figure.position.set(placement.x, 0, placement.z);
  stepFigureOnGround(figure);

  if (camera.coverage === 'dirty-single') {
    figure.position.set(placement.x, 0, placement.z);
    stepFigureOnGround(figure);
  }
}

function layoutTwoShot(
  figures: HumanoidFigure[],
  camera: CameraSettings,
  placement: { x: number; z: number },
) {
  const [a, b] = figures;

  if (camera.coverage === 'ots') {
    a.position.set(-0.35, 0, 0.15);
    a.rotation.y = -70 * (Math.PI / 180);
    b.position.set(0.45, 0, -0.1);
    b.rotation.y = -110 * (Math.PI / 180);
    stepFigureOnGround(a);
    stepFigureOnGround(b);
    return;
  }

  if (camera.coverage === 'one-half') {
    a.position.set(placement.x, 0, placement.z + 0.1);
    b.position.set(placement.x, 0, placement.z - 0.85);
    setFigureScale(b, 0.92);
    applyNeutralPose(a);
    applyNeutralPose(b);
    stepFigureOnGround(a);
    stepFigureOnGround(b);
    return;
  }

  if (camera.coverage === 'dirty-single') {
    a.position.set(placement.x, 0, placement.z);
    b.position.set(placement.x + 0.75, 0, placement.z);
    setLegsVisible(b, false);
    stepFigureOnGround(a);
    stepFigureOnGround(b);
    return;
  }

  a.position.set(placement.x - 0.4, 0, placement.z);
  a.rotation.y = -105 * (Math.PI / 180);
  b.position.set(placement.x + 0.4, 0, placement.z);
  b.rotation.y = -75 * (Math.PI / 180);
  stepFigureOnGround(a);
  stepFigureOnGround(b);
}

function layoutThreeShot(figures: HumanoidFigure[], placement: { x: number; z: number }) {
  const offsets = [-0.55, 0, 0.55];
  figures.forEach((figure, i) => {
    figure.position.set(placement.x + offsets[i], 0, placement.z);
    figure.rotation.y = (-90 + (i - 1) * 12) * (Math.PI / 180);
    stepFigureOnGround(figure);
  });
}

function layoutGroup(figures: HumanoidFigure[], count: number, placement: { x: number; z: number }) {
  const cols = count >= 10 ? 5 : count;
  const spacing = count >= 10 ? 0.45 : 0.55;
  const startX = -((cols - 1) * spacing) / 2;

  figures.forEach((figure, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    figure.position.set(
      placement.x + startX + col * spacing,
      0,
      placement.z - row * 0.5,
    );
    figure.rotation.y = -90 * (Math.PI / 180);
    stepFigureOnGround(figure);
  });
}

export function disposeFigure(figure: HumanoidFigure, parent: THREE.Object3D) {
  parent.remove(figure);
  figure.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material?.dispose();
      }
    }
  });
}