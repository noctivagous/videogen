import { Male, Child } from 'mannequin-js/src/mannequin.js';
import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { getPlacementOffset } from '@/lib/studio/camera-mapper';
import type { CameraSettings, ScenePreviewPayload } from '@/lib/types/studio';
import type { Scene } from 'three';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Figure = any;

const BRAND_COLORS = ['antiquewhite', 'bisque', 'burlywood', 'wheat', 'linen'];

export function getFigureCount(camera: CameraSettings): number {
  switch (camera?.subjectCount) {
    case '2s': return 2;
    case '3s': return 3;
    case 'group': return 5;
    case 'crowd': return 10;
    default: return 1;
  }
}

export function createFigure(index: number, total: number): Figure {
  if (total >= 10) {
    return new Child(1.05);
  }
  const figure = new Male(1.8);
  figure.recolor(
    BRAND_COLORS[index % BRAND_COLORS.length],
    'gray',
    'antiquewhite',
    'burlywood',
    'antiquewhite',
    'bisque',
    'burlywood',
  );
  return figure;
}

function applyNeutralPose(figure: Figure) {
  figure.turn = -90;
  figure.torso.bend = 2;
  figure.head.nod = -8;
  figure.l_arm.raise = -8;
  figure.r_arm.raise = -8;
  figure.l_elbow.bend = 18;
  figure.r_elbow.bend = 18;
  figure.stepOnGround();
}

function applyTalkingPose(figure: Figure, time: number) {
  applyNeutralPose(figure);
  figure.head.nod = -8 + Math.sin(time * 4) * 4;
}

function applyWalkingPose(figure: Figure, time: number) {
  applyNeutralPose(figure);
  const swing = Math.sin(time * 3) * 12;
  figure.l_arm.raise = -8 + swing;
  figure.r_arm.raise = -8 - swing;
  figure.l_leg.raise = swing * 0.4;
  figure.r_leg.raise = -swing * 0.4;
}

export function layoutFigures(figures: Figure[], payload: ScenePreviewPayload, animTime = 0) {
  const { camera, shot, motion } = payload;
  const frame = shot?.frameComposition || DEFAULT_FRAME_COMPOSITION;
  const placement = getPlacementOffset(frame);
  const count = figures.length;
  const action = motion?.subjectAction || 'still';

  figures.forEach((figure) => {
    figure.visible = true;
    figure.l_leg?.show?.();
    figure.r_leg?.show?.();
    figure.scale.setScalar(count >= 10 ? 0.85 : 1);

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

function layoutSingle(figure: Figure, camera: CameraSettings, placement: { x: number; z: number }) {
  figure.position.set(placement.x, 0, placement.z);
  figure.turn = -90;

  if (camera.coverage === 'dirty-single') {
    figure.position.set(placement.x, 0, placement.z);
  }
}

function layoutTwoShot(
  figures: Figure[],
  camera: CameraSettings,
  placement: { x: number; z: number },
) {
  const [a, b] = figures;

  if (camera.coverage === 'ots') {
    a.position.set(-0.35, 0, 0.15);
    a.turn = -70;
    b.position.set(0.45, 0, -0.1);
    b.turn = -110;
    a.r_arm.show();
    return;
  }

  if (camera.coverage === 'one-half') {
    a.position.set(placement.x, 0, placement.z + 0.1);
    a.turn = -90;
    b.position.set(placement.x, 0, placement.z - 0.85);
    b.turn = -90;
    b.scale.setScalar(0.92);
    return;
  }

  if (camera.coverage === 'dirty-single') {
    a.position.set(placement.x, 0, placement.z);
    a.turn = -90;
    b.position.set(placement.x + 0.75, 0, placement.z);
    b.turn = -90;
    b.l_leg.hide();
    b.r_leg.hide();
    return;
  }

  a.position.set(placement.x - 0.4, 0, placement.z);
  a.turn = -105;
  b.position.set(placement.x + 0.4, 0, placement.z);
  b.turn = -75;
}

function layoutThreeShot(figures: Figure[], placement: { x: number; z: number }) {
  const offsets = [-0.55, 0, 0.55];
  figures.forEach((figure, i) => {
    figure.position.set(placement.x + offsets[i], 0, placement.z);
    figure.turn = -90 + (i - 1) * 12;
    figure.stepOnGround();
  });
}

function layoutGroup(figures: Figure[], count: number, placement: { x: number; z: number }) {
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
    figure.turn = -90;
    figure.stepOnGround();
  });
}

export function disposeFigure(figure: Figure, scene: Scene) {
  scene.remove(figure);
}