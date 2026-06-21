import { crowdDensitySpacingScale } from '@/lib/constants/crowd-density-options';
import { createDefaultMannequin } from '@/lib/studio/mannequin-factory';
import type {
  CameraSettings,
  CrowdDensity,
  GroupArrangement,
  Mannequin,
  MannequinAngle,
  SubjectArrangement,
  ThreeShotArrangement,
  TwoShotArrangement,
} from '@/lib/types/studio';

export interface LayoutAnchor {
  anchorX: number;
  feetY: number;
  scale: number;
}

function pctX(value: number): number {
  return value / 100;
}

function pctY(value: number): number {
  return value / 100;
}

/** Shared OTS geometry — side is camera shoulder position. */
export function layoutTwoShotOts(
  anchor: LayoutAnchor,
  side: 'left' | 'right',
): [Mannequin, Mannequin] {
  const { anchorX, feetY, scale } = anchor;
  if (side === 'left') {
    return [
      createDefaultMannequin({
        x: pctX(18),
        y: feetY,
        scale: scale * 1.35,
        rotation: -25,
        angle: 'threeQuarterRight',
      }),
      createDefaultMannequin({
        x: anchorX,
        y: feetY,
        scale: scale * 0.9,
        rotation: 15,
        angle: 'threeQuarterLeft',
      }),
    ];
  }
  return [
    createDefaultMannequin({
      x: pctX(82),
      y: feetY,
      scale: scale * 1.35,
      rotation: 25,
      angle: 'threeQuarterLeft',
    }),
    createDefaultMannequin({
      x: anchorX,
      y: feetY,
      scale: scale * 0.9,
      rotation: -15,
      angle: 'threeQuarterRight',
    }),
  ];
}

export function layoutTwoShotDirty(anchor: LayoutAnchor): [Mannequin, Mannequin] {
  const { anchorX, feetY, scale } = anchor;
  return [
    createDefaultMannequin({ x: anchorX, y: feetY, scale }),
    createDefaultMannequin({
      x: Math.min(0.92, anchorX + 0.18),
      y: feetY,
      scale: scale * 1.1,
      opacity: 0.3,
      angle: 'threeQuarterLeft',
      rotation: -15,
    }),
  ];
}

export function layoutTwoShotStaggered(anchor: LayoutAnchor): [Mannequin, Mannequin] {
  const { anchorX, feetY, scale } = anchor;
  return [
    createDefaultMannequin({ x: anchorX, y: pctY(feetY * 100 - 2), scale }),
    createDefaultMannequin({
      x: anchorX,
      y: pctY(feetY * 100 + 14),
      scale: scale * 0.92,
    }),
  ];
}

export function layoutTwoShotClean(anchor: LayoutAnchor): [Mannequin, Mannequin] {
  const { anchorX, feetY, scale } = anchor;
  return [
    createDefaultMannequin({
      x: anchorX - 0.12,
      y: feetY,
      scale,
      rotation: -12,
      angle: 'threeQuarterRight',
    }),
    createDefaultMannequin({
      x: anchorX + 0.12,
      y: feetY,
      scale,
      rotation: 12,
      angle: 'threeQuarterLeft',
    }),
  ];
}

export function layoutTwoShotProfile(anchor: LayoutAnchor): [Mannequin, Mannequin] {
  const { anchorX, feetY, scale } = anchor;
  return [
    createDefaultMannequin({
      x: anchorX - 0.1,
      y: feetY,
      scale,
      rotation: -90,
      angle: 'left',
    }),
    createDefaultMannequin({
      x: anchorX + 0.1,
      y: feetY,
      scale,
      rotation: 90,
      angle: 'right',
    }),
  ];
}

export function layoutTwoShotFromArrangement(
  arrangement: TwoShotArrangement,
  anchor: LayoutAnchor,
): Mannequin[] {
  switch (arrangement) {
    case 'two-shot-dirty':
      return layoutTwoShotDirty(anchor);
    case 'ots-left':
      return layoutTwoShotOts(anchor, 'left');
    case 'ots-right':
      return layoutTwoShotOts(anchor, 'right');
    case 'profile':
      return layoutTwoShotProfile(anchor);
    case 'staggered':
      return layoutTwoShotStaggered(anchor);
    default:
      return layoutTwoShotClean(anchor);
  }
}

export function layoutThreeShotFromArrangement(
  arrangement: ThreeShotArrangement,
  anchor: LayoutAnchor,
): Mannequin[] {
  const { anchorX, feetY, scale } = anchor;
  switch (arrangement) {
    case 'three-shot-staggered':
      return [
        createDefaultMannequin({ x: anchorX - 0.12, y: pctY(feetY * 100 + 10), scale: scale * 0.92, rotation: -8 }),
        createDefaultMannequin({ x: anchorX, y: pctY(feetY * 100 - 3), scale }),
        createDefaultMannequin({ x: anchorX + 0.12, y: pctY(feetY * 100 + 10), scale: scale * 0.92, rotation: 8 }),
      ];
    case 'three-shot-ots':
      return [
        createDefaultMannequin({
          x: pctX(15),
          y: feetY,
          scale: scale * 1.2,
          rotation: -20,
          angle: 'threeQuarterRight',
          opacity: 0.35,
        }),
        createDefaultMannequin({ x: anchorX, y: feetY, scale }),
        createDefaultMannequin({ x: anchorX + 0.14, y: feetY, scale, rotation: 10 }),
      ];
    case 'three-shot-triangle':
      return [
        createDefaultMannequin({ x: anchorX - 0.1, y: pctY(feetY * 100 + 6), scale: scale * 0.95, rotation: -15 }),
        createDefaultMannequin({ x: anchorX, y: pctY(feetY * 100 - 4), scale }),
        createDefaultMannequin({ x: anchorX + 0.1, y: pctY(feetY * 100 + 6), scale: scale * 0.95, rotation: 15 }),
      ];
    default:
      return [
        createDefaultMannequin({ x: anchorX - 0.14, y: feetY, scale, rotation: -12 }),
        createDefaultMannequin({ x: anchorX, y: feetY, scale }),
        createDefaultMannequin({ x: anchorX + 0.14, y: feetY, scale, rotation: 12 }),
      ];
  }
}

function gridMannequins(
  count: number,
  cols: number,
  spacing: number,
  anchor: LayoutAnchor,
  angle: MannequinAngle = 'front',
  rowDepth = 8,
): Mannequin[] {
  const { anchorX, feetY, scale } = anchor;
  const anchorPctX = anchorX * 100;
  const feetPctY = feetY * 100;
  const startX = anchorPctX - ((cols - 1) * spacing) / 2;
  const mannequins: Mannequin[] = [];

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    mannequins.push(
      createDefaultMannequin({
        x: pctX(startX + col * spacing),
        y: pctY(feetPctY + row * rowDepth),
        scale,
        rotation: 0,
        angle,
      }),
    );
  }
  return mannequins;
}

export function layoutGroupFromArrangement(
  arrangement: GroupArrangement,
  anchor: LayoutAnchor,
  count: number,
  fillRestWithGenerics: boolean,
): Mannequin[] {
  const { anchorX, feetY, scale } = anchor;
  let mannequins: Mannequin[];

  switch (arrangement) {
    case 'conversation-circle': {
      const radius = 0.14;
      mannequins = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        mannequins.push(
          createDefaultMannequin({
            x: anchorX + Math.cos(angle) * radius,
            y: feetY + Math.sin(angle) * 0.06,
            scale: scale * 0.92,
            rotation: (angle * 180) / Math.PI + 90,
            angle: 'threeQuarterLeft',
          }),
        );
      }
      break;
    }
    case 'walk-and-talk': {
      mannequins = [];
      for (let i = 0; i < count; i++) {
        mannequins.push(
          createDefaultMannequin({
            x: anchorX - 0.2 + i * 0.1,
            y: pctY(feetY * 100 + i * 4),
            scale: scale * (1 - i * 0.04),
            rotation: -5 + i * 2,
            angle: 'threeQuarterRight',
          }),
        );
      }
      break;
    }
    default:
      mannequins = gridMannequins(count, count, 11, anchor);
  }

  if (fillRestWithGenerics) {
    return mannequins.map((m, i) =>
      i >= 4 ? { ...m, opacity: 0.35 } : m,
    );
  }
  return mannequins;
}

export function layoutCrowd(
  anchor: LayoutAnchor,
  count: number,
  density: CrowdDensity,
): Mannequin[] {
  const spacingScale = crowdDensitySpacingScale(density);
  const spacing = 9 * spacingScale;
  const cols = 5;
  return gridMannequins(count, cols, spacing, anchor, 'threeQuarterLeft').map((m, i) =>
    i < 2 ? m : { ...m, opacity: 0.35 },
  );
}

/** 1S coverage layouts — coverage drives placement for single-subject shots. */
export function layoutOneShotFromCoverage(
  camera: CameraSettings,
  anchor: LayoutAnchor,
): Mannequin[] {
  const { anchorX, feetY, scale } = anchor;

  if (camera.coverage === 'pov') {
    return [];
  }

  if (camera.coverage === 'dirty-single') {
    return layoutTwoShotDirty(anchor);
  }

  if (camera.coverage === 'ots') {
    return layoutTwoShotOts(anchor, 'left');
  }

  if (camera.coverage === 'one-half') {
    return layoutTwoShotStaggered(anchor);
  }

  return [createDefaultMannequin({ x: anchorX, y: feetY, scale })];
}

export function layoutFromCamera(
  camera: CameraSettings,
  anchor: LayoutAnchor,
  count: number,
): Mannequin[] {
  switch (camera.subjectCount) {
    case '1s':
      return layoutOneShotFromCoverage(camera, anchor);
    case '2s':
      return layoutTwoShotFromArrangement(camera.arrangement as TwoShotArrangement, anchor);
    case '3s':
      return layoutThreeShotFromArrangement(camera.arrangement as ThreeShotArrangement, anchor);
    case 'group':
      return layoutGroupFromArrangement(
        camera.arrangement as GroupArrangement,
        anchor,
        count,
        camera.fillRestWithGenerics,
      );
    case 'crowd':
      return layoutCrowd(anchor, count, camera.crowdDensity);
    default:
      return [createDefaultMannequin({ x: anchor.anchorX, y: anchor.feetY, scale: anchor.scale })];
  }
}
