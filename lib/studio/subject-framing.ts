import type { CSSProperties } from 'react';
import { PLACEMENT_POSITIONS } from '@/lib/constants/camera';
import { FIELD_SIZE_HEIGHT_PCT, HEADROOM_Y_OFFSET } from '@/lib/constants/framing';
import type {
  AspectRatio,
  CameraAngle,
  CameraSettings,
  CompositionGuide,
  FieldSize,
  Headroom,
  Placement,
} from '@/lib/types/studio';

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function parseAspect(ar: string): number {
  const [w, h] = String(ar).split(':').map(Number);
  if (!w || !h) return 16 / 9;
  return w / h;
}

function angleTransform(angle: CameraAngle): string {
  switch (angle) {
    case 'low-angle':
    case 'worms-eye':
      return 'perspective(900px) rotateX(6deg) scale(1.04)';
    case 'high-angle':
    case 'birds-eye':
    case 'drone':
      return 'perspective(900px) rotateX(-6deg) scale(0.98)';
    case 'dutch':
      return 'rotate(-2.5deg) scale(1.03)';
    default:
      return 'none';
  }
}

/** Aspect-ratio reframe scale relative to 16:9 master assets. */
function aspectScale(aspectRatio: AspectRatio): number {
  const aspect = parseAspect(aspectRatio);
  const master = 16 / 9;
  if (aspect < master) {
    // Taller frame (9:16, 1:1) — zoom subject to preserve height %
    return Math.sqrt(master / aspect) * 1.05;
  }
  if (aspect > master) {
    // Wider frame (21:9) — slightly pull back
    return 0.92;
  }
  return 1;
}

function usesPlacementPositioning(guide: CompositionGuide): boolean {
  return guide === 'grid-3x3';
}

/**
 * Shift subject layer so its center aligns with the placement marker.
 * object-position is ineffective when cutout and frame share the same aspect
 * ratio under object-fit:cover (no crop to pan), so we translate instead.
 */
function placementShift(
  aspectRatio: AspectRatio,
  placement: Placement,
  guide: CompositionGuide,
): { x: number; y: number } {
  if (!usesPlacementPositioning(guide)) {
    return { x: 0, y: 0 };
  }

  const pos = PLACEMENT_POSITIONS[placement] ?? PLACEMENT_POSITIONS['cell-1-1'];
  let y = pos.y - 50;

  const aspect = parseAspect(aspectRatio);
  if (aspect < 1) y -= 1.5;
  if (aspect > 2) y += 0.5;

  return { x: pos.x - 50, y };
}

export function getSubjectLayerStyle(opts: {
  aspectRatio: AspectRatio;
  fieldSize: FieldSize;
  placement: Placement;
  headroom: Headroom;
  angle: CameraAngle;
  guide?: CompositionGuide;
  coverage?: CameraSettings['coverage'];
  /** Per-field cutout assets already embed framing in the image */
  fieldSpecificAsset?: boolean;
}): CSSProperties {
  const guide = opts.guide ?? 'none';
  const scale = aspectScale(opts.aspectRatio);
  const headroomOffset = HEADROOM_Y_OFFSET[opts.headroom] ?? 0;
  const otsBoost = opts.coverage === 'ots' ? 1.04 : 1;

  const framingScale = opts.fieldSpecificAsset
    ? 1
    : (FIELD_SIZE_HEIGHT_PCT[opts.fieldSize] ?? FIELD_SIZE_HEIGHT_PCT.ms) / 95;

  const pos = PLACEMENT_POSITIONS[opts.placement] ?? PLACEMENT_POSITIONS['cell-1-1'];
  const compose = usesPlacementPositioning(guide);
  const shift = placementShift(opts.aspectRatio, opts.placement, guide);
  const totalScale = framingScale * scale * otsBoost;
  const angle = angleTransform(opts.angle);

  const transforms: string[] = [];
  if (shift.x !== 0 || shift.y !== 0) {
    transforms.push(`translate(${shift.x}%, ${shift.y}%)`);
  }
  if (headroomOffset !== 0) {
    transforms.push(`translateY(${headroomOffset}px)`);
  }
  if (totalScale !== 1) {
    transforms.push(`scale(${totalScale.toFixed(3)})`);
  }
  if (angle !== 'none') {
    transforms.push(angle);
  }

  return {
    objectFit: 'cover',
    objectPosition: '50% 50%',
    ...(transforms.length > 0 ? { transform: transforms.join(' ') } : {}),
    transformOrigin: compose ? `${pos.x}% ${pos.y}%` : '50% 50%',
    width: '100%',
    height: '100%',
  };
}

export function getBackdropLayerStyle(
  placement: Placement,
  angle: CameraAngle,
): CSSProperties {
  const pos = PLACEMENT_POSITIONS[placement] ?? PLACEMENT_POSITIONS['cell-1-1'];
  const panX = (pos.x - 50) * 0.2;
  const panY = (pos.y - 50) * 0.15;
  return {
    objectFit: 'cover',
    objectPosition: `${50 + panX}% ${50 + panY}%`,
    transform: angleTransform(angle),
    transformOrigin: '50% 50%',
    width: '100%',
    height: '100%',
  };
}