import { DEFAULT_FRAME_COMPOSITION, PLACEMENT_POSITIONS } from '@/lib/constants/camera';
import { FIELD_SIZE_HEIGHT_PCT, HEADROOM_Y_OFFSET } from '@/lib/constants/framing';
import { MANNEQUIN_GRAY_VARIANTS } from '@/lib/constants/mannequin';
import type { CameraSettings, ScenePreviewPayload } from '@/lib/types/studio';

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
  const pos = PLACEMENT_POSITIONS[frame.placement] || PLACEMENT_POSITIONS.center;
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

  if (camera.coverage === 'pov') return [];

  const scale = (heightPct / FIELD_SIZE_HEIGHT_PCT.ms) * groupScale;

  if (count === 1) {
    const fig = baseFigure(0, anchorX, feetY, { scale, pose, variant, rotation: 0 });
    if (camera.coverage === 'dirty-single') {
      fig.x = anchorX;
    }
    return [fig];
  }

  if (count === 2) {
    if (camera.coverage === 'ots') {
      return [
        baseFigure(0, 18, feetY, {
          scale: scale * 1.35,
          variant: 'shoulder',
          zIndex: 20,
          rotation: -25,
          color: FIGURE_COLORS[0],
        }),
        baseFigure(1, anchorX, feetY, {
          scale: scale * 0.9,
          pose,
          variant,
          rotation: 15,
          color: FIGURE_COLORS[1],
        }),
      ];
    }

    if (camera.coverage === 'one-half') {
      return [
        baseFigure(0, anchorX, feetY - 2, { scale, pose, variant, rotation: 0 }),
        baseFigure(1, anchorX, feetY + 14, { scale: scale * 0.92, pose, variant, rotation: 0, zIndex: 5 }),
      ];
    }

    if (camera.coverage === 'dirty-single') {
      return [
        baseFigure(0, anchorX, feetY, { scale, pose, variant, rotation: 0 }),
        baseFigure(1, anchorX + 18, feetY, {
          scale,
          pose,
          variant,
          rotation: 0,
          hideLegs: true,
        }),
      ];
    }

    return [
      baseFigure(0, anchorX - 12, feetY, { scale, pose, variant, rotation: -12 }),
      baseFigure(1, anchorX + 12, feetY, { scale, pose, variant, rotation: 12 }),
    ];
  }

  if (count === 3) {
    const offsets = [-14, 0, 14];
    return offsets.map((dx, i) =>
      baseFigure(i, anchorX + dx, feetY, {
        scale,
        pose,
        variant,
        rotation: (i - 1) * 12,
      }),
    );
  }

  const cols = isCrowd ? 5 : count;
  const spacing = isCrowd ? 9 : 11;
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