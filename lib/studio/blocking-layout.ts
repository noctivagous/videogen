import { DEFAULT_FRAME_COMPOSITION, PLACEMENT_POSITIONS } from '@/lib/constants/camera';
import { crowdDensitySpacingScale } from '@/lib/constants/crowd-density-options';
import { FIELD_SIZE_HEIGHT_PCT, HEADROOM_Y_OFFSET } from '@/lib/constants/framing';
import { MANNEQUIN_GRAY_VARIANTS } from '@/lib/constants/mannequin';
import type {
  CameraSettings,
  GroupArrangement,
  ScenePreviewPayload,
  ThreeShotArrangement,
  TwoShotArrangement,
} from '@/lib/types/studio';

export type BlockingPose = 'neutral' | 'talking' | 'walking';
export type BlockingVariant = 'adult' | 'child' | 'shoulder';

export interface BlockingFigure {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  pose: BlockingPose;
  visible: boolean;
  zIndex: number;
  color: string;
  variant: BlockingVariant;
  hideLegs?: boolean;
}

const FIGURE_COLORS = [...MANNEQUIN_GRAY_VARIANTS];

export function getFigureCount(camera: CameraSettings): number {
  switch (camera?.subjectCount) {
    case '2s': return 2;
    case '3s': return 3;
    case 'group': return 5;
    case 'crowd': return 10;
    default: return 1;
  }
}

function baseFigure(
  id: number,
  x: number,
  y: number,
  opts: Partial<BlockingFigure> = {},
): BlockingFigure {
  return {
    id,
    x,
    y,
    scale: 1,
    rotation: 0,
    pose: 'neutral',
    visible: true,
    zIndex: 10 + id,
    color: FIGURE_COLORS[id % FIGURE_COLORS.length],
    variant: 'adult',
    ...opts,
  };
}

function anchorFromPlacement(payload: ScenePreviewPayload) {
  const frame = payload.shot?.frameComposition || DEFAULT_FRAME_COMPOSITION;
  const pos = PLACEMENT_POSITIONS[frame.placement] || PLACEMENT_POSITIONS['cell-1-1'];
  const headroom = HEADROOM_Y_OFFSET[frame.headroom] || 0;
  const heightPct = FIELD_SIZE_HEIGHT_PCT[payload.camera.fieldSize] || FIELD_SIZE_HEIGHT_PCT.ms;
  const feetY = 92 - headroom;
  return { x: pos.x, feetY, heightPct };
}

function poseFromMotion(action: string): BlockingPose {
  if (action === 'talking') return 'talking';
  if (action === 'walking' || action === 'running') return 'walking';
  return 'neutral';
}

function blockingTwoShot(
  arrangement: TwoShotArrangement,
  anchorX: number,
  feetY: number,
  scale: number,
  pose: BlockingPose,
  variant: BlockingVariant,
): BlockingFigure[] {
  switch (arrangement) {
    case 'two-shot-dirty':
      return [
        baseFigure(0, anchorX, feetY, { scale, pose, variant }),
        baseFigure(1, anchorX + 18, feetY, { scale, variant: 'shoulder', zIndex: 5, hideLegs: true }),
      ];
    case 'ots-left':
      return [
        baseFigure(0, 18, feetY, { scale: scale * 1.35, variant: 'shoulder', zIndex: 20, rotation: -25 }),
        baseFigure(1, anchorX, feetY, { scale: scale * 0.9, pose, variant, rotation: 15 }),
      ];
    case 'ots-right':
      return [
        baseFigure(0, 82, feetY, { scale: scale * 1.35, variant: 'shoulder', zIndex: 20, rotation: 25 }),
        baseFigure(1, anchorX, feetY, { scale: scale * 0.9, pose, variant, rotation: -15 }),
      ];
    case 'profile':
      return [
        baseFigure(0, anchorX - 10, feetY, { scale, pose, variant, rotation: -90 }),
        baseFigure(1, anchorX + 10, feetY, { scale, pose, variant, rotation: 90 }),
      ];
    case 'staggered':
      return [
        baseFigure(0, anchorX, feetY - 2, { scale, pose, variant }),
        baseFigure(1, anchorX, feetY + 14, { scale: scale * 0.92, pose, variant, zIndex: 5 }),
      ];
    default:
      return [
        baseFigure(0, anchorX - 12, feetY, { scale, pose, variant, rotation: -12 }),
        baseFigure(1, anchorX + 12, feetY, { scale, pose, variant, rotation: 12 }),
      ];
  }
}

function blockingThreeShot(
  arrangement: ThreeShotArrangement,
  anchorX: number,
  feetY: number,
  scale: number,
  pose: BlockingPose,
  variant: BlockingVariant,
): BlockingFigure[] {
  switch (arrangement) {
    case 'three-shot-staggered':
      return [
        baseFigure(0, anchorX - 12, feetY + 10, { scale: scale * 0.92, pose, variant, rotation: -8 }),
        baseFigure(1, anchorX, feetY - 3, { scale, pose, variant }),
        baseFigure(2, anchorX + 12, feetY + 10, { scale: scale * 0.92, pose, variant, rotation: 8 }),
      ];
    case 'three-shot-ots':
      return [
        baseFigure(0, 15, feetY, { scale: scale * 1.2, variant: 'shoulder', zIndex: 20, rotation: -20 }),
        baseFigure(1, anchorX, feetY, { scale, pose, variant }),
        baseFigure(2, anchorX + 14, feetY, { scale, pose, variant, rotation: 10 }),
      ];
    case 'three-shot-triangle':
      return [
        baseFigure(0, anchorX - 10, feetY + 6, { scale: scale * 0.95, pose, variant, rotation: -15 }),
        baseFigure(1, anchorX, feetY - 4, { scale, pose, variant }),
        baseFigure(2, anchorX + 10, feetY + 6, { scale: scale * 0.95, pose, variant, rotation: 15 }),
      ];
    default:
      return [-14, 0, 14].map((dx, i) =>
        baseFigure(i, anchorX + dx, feetY, {
          scale,
          pose,
          variant,
          rotation: (i - 1) * 12,
        }),
      );
  }
}

function blockingGroup(
  arrangement: GroupArrangement,
  anchorX: number,
  feetY: number,
  scale: number,
  count: number,
  pose: BlockingPose,
  variant: BlockingVariant,
): BlockingFigure[] {
  if (arrangement === 'walk-and-talk') {
    return Array.from({ length: count }, (_, i) =>
      baseFigure(i, anchorX - 20 + i * 10, feetY + i * 4, {
        scale: scale * (1 - i * 0.04),
        pose,
        variant,
        rotation: -5 + i * 2,
        zIndex: 10 + i,
      }),
    );
  }

  if (arrangement === 'conversation-circle') {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      return baseFigure(i, anchorX + Math.cos(angle) * 14, feetY + Math.sin(angle) * 6, {
        scale: scale * 0.92,
        pose,
        variant,
        rotation: (angle * 180) / Math.PI + 90,
        zIndex: 10 + i,
      });
    });
  }

  const cols = count;
  const spacing = 11;
  const startX = anchorX - ((cols - 1) * spacing) / 2;
  return Array.from({ length: count }, (_, i) =>
    baseFigure(i, startX + (i % cols) * spacing, feetY + Math.floor(i / cols) * 8, {
      scale,
      pose,
      variant,
      zIndex: 10 + i,
    }),
  );
}

export function getBlockingFigures(
  payload: ScenePreviewPayload,
  _animTime = 0,
): BlockingFigure[] {
  const { camera, motion } = payload;
  const count = getFigureCount(camera);
  const pose = poseFromMotion(motion?.subjectAction || 'still');
  const { x: anchorX, feetY, heightPct } = anchorFromPlacement(payload);
  const isCrowd = count >= 10;
  const groupScale = isCrowd ? 0.85 : 1;
  const variant: BlockingVariant = isCrowd ? 'child' : 'adult';

  if (camera.subjectCount === '1s' && camera.coverage === 'pov') return [];

  const scale = (heightPct / FIELD_SIZE_HEIGHT_PCT.ms) * groupScale;

  if (camera.subjectCount === '2s') {
    return blockingTwoShot(camera.arrangement as TwoShotArrangement, anchorX, feetY, scale, pose, variant);
  }

  if (camera.subjectCount === '3s') {
    return blockingThreeShot(camera.arrangement as ThreeShotArrangement, anchorX, feetY, scale, pose, variant);
  }

  if (camera.subjectCount === 'group') {
    return blockingGroup(camera.arrangement as GroupArrangement, anchorX, feetY, scale, count, pose, variant);
  }

  if (count === 1) {
    const fig = baseFigure(0, anchorX, feetY, { scale, pose, variant, rotation: 0 });
    if (camera.coverage === 'dirty-single') {
      return [
        fig,
        baseFigure(1, anchorX + 18, feetY, { scale, variant: 'shoulder', zIndex: 5, hideLegs: true }),
      ];
    }
    if (camera.coverage === 'ots') {
      return blockingTwoShot('ots-left', anchorX, feetY, scale, pose, variant);
    }
    if (camera.coverage === 'one-half') {
      return blockingTwoShot('staggered', anchorX, feetY, scale, pose, variant);
    }
    return [fig];
  }

  if (count === 2) {
    if (camera.coverage === 'ots') {
      return blockingTwoShot('ots-left', anchorX, feetY, scale, pose, variant);
    }
    if (camera.coverage === 'one-half') {
      return blockingTwoShot('staggered', anchorX, feetY, scale, pose, variant);
    }
    if (camera.coverage === 'dirty-single') {
      return blockingTwoShot('two-shot-dirty', anchorX, feetY, scale, pose, variant);
    }
    return blockingTwoShot('two-shot-clean', anchorX, feetY, scale, pose, variant);
  }

  if (count === 3) {
    return blockingThreeShot('three-shot-clean', anchorX, feetY, scale, pose, variant);
  }

  const spacingScale = crowdDensitySpacingScale(camera.crowdDensity);
  const cols = 5;
  const spacing = 9 * spacingScale;
  const startX = anchorX - ((cols - 1) * spacing) / 2;
  const figures: BlockingFigure[] = [];

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    figures.push(
      baseFigure(i, startX + col * spacing, feetY + row * 8, {
        scale,
        pose,
        variant,
        rotation: 0,
        zIndex: 10 + i,
      }),
    );
  }

  return figures;
}
