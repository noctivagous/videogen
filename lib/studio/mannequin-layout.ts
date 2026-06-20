import {
  applyAgeScale,
  mannequinEffectiveAgeScale,
  mannequinTrim,
  mannequinVariantFrom,
} from '@/lib/constants/mannequin-assets';
import { FIELD_SIZE_FRAMING, HEADROOM_Y_OFFSET } from '@/lib/constants/framing';
import type { FieldSize, Headroom, Mannequin, MannequinAngle } from '@/lib/types/studio';

/** Figure height as fraction of frame height at scale=1 — matches bake canvas base. */
export const MANNEQUIN_BASE_HEIGHT_RATIO = 0.55;

export const MANNEQUIN_SCALE_MIN = 0.1;
/** Upper bound for CU/ECU — figure can dwarf the frame when feet sit below the bottom edge. */
export const MANNEQUIN_SCALE_MAX = 10;

/** Normalized feet-anchor X (0 = left edge, 1 = right edge). */
export const MANNEQUIN_ANCHOR_X_MIN = 0;
export const MANNEQUIN_ANCHOR_X_MAX = 1;
/** Normalized feet-anchor Y (0 = top, 1 = frame bottom, >1 = below frame for close-ups). */
export const MANNEQUIN_ANCHOR_Y_MIN = 0;
/** Floor for downward travel — actual max grows with mannequin scale (see maxFeetAnchorY). */
export const MANNEQUIN_ANCHOR_Y_MAX_BASE = 2.5;

export interface ClampMannequinAnchorOptions {
  maxY?: number;
}

/**
 * How far below the frame bottom the feet anchor may sit (normalized Y).
 * Scales with figure height so CU/ECU at high scale can push feet well off-screen.
 */
export function maxFeetAnchorY(
  mannequin?: Pick<Mannequin, 'scale'> & Partial<Pick<Mannequin, 'age' | 'ageScale'>>,
): number {
  if (!mannequin) return MANNEQUIN_ANCHOR_Y_MAX_BASE;
  const scale = effectiveMannequinScale({
    scale: mannequin.scale,
    age: mannequin.age ?? 'adult',
    ageScale: mannequin.ageScale,
  });
  const figureSpan = scale * MANNEQUIN_BASE_HEIGHT_RATIO;
  return Math.max(MANNEQUIN_ANCHOR_Y_MAX_BASE, 1 + figureSpan * 1.15);
}

export function clampMannequinAnchor(
  position: { x: number; y: number },
  options?: ClampMannequinAnchorOptions,
): { x: number; y: number } {
  const yMax = options?.maxY ?? MANNEQUIN_ANCHOR_Y_MAX_BASE;
  return {
    x: Math.min(MANNEQUIN_ANCHOR_X_MAX, Math.max(MANNEQUIN_ANCHOR_X_MIN, position.x)),
    y: Math.min(yMax, Math.max(MANNEQUIN_ANCHOR_Y_MIN, position.y)),
  };
}

/**
 * Default feet Y for a field size. Close-ups (small spanRatio) place feet below the frame
 * bottom so the upper body fills the shot — legs crop off-screen.
 */
export function defaultFeetAnchorY(
  fieldSize: FieldSize,
  headroom: Headroom = 'normal',
): number {
  const framing = FIELD_SIZE_FRAMING[fieldSize] ?? FIELD_SIZE_FRAMING.ms;
  const headroomNudge = -(HEADROOM_Y_OFFSET[headroom] ?? 0) * 0.003;

  const fieldScale =
    (FIELD_SIZE_FRAMING[fieldSize]?.spanRatio ?? FIELD_SIZE_FRAMING.ms.spanRatio) /
    FIELD_SIZE_FRAMING.ms.spanRatio;
  const yMax = maxFeetAnchorY({ scale: fieldScale });

  if (framing.spanRatio >= 0.95) {
    return clampMannequinAnchor({ x: 0.5, y: 0.92 + headroomNudge }, { maxY: yMax }).y;
  }

  const belowFrame = (1 - framing.spanRatio) * 0.45;
  return clampMannequinAnchor({ x: 0.5, y: 1 + belowFrame + headroomNudge }, { maxY: yMax }).y;
}

export function clampMannequinScale(scale: number): number {
  return Math.min(MANNEQUIN_SCALE_MAX, Math.max(MANNEQUIN_SCALE_MIN, scale));
}

export function effectiveMannequinScale(
  mannequin: Pick<Mannequin, 'scale' | 'age' | 'ageScale'>,
): number {
  return applyAgeScale(mannequin.scale, mannequinEffectiveAgeScale(mannequin));
}

/** Visual figure height as CSS percentage of frame (0–100). */
export function mannequinVisualHeightPct(
  mannequin: Pick<Mannequin, 'scale' | 'age' | 'ageScale'>,
): number {
  return MANNEQUIN_BASE_HEIGHT_RATIO * 100 * effectiveMannequinScale(mannequin);
}

/** PNG height percentage for preview — sized to visual figure height plus trim padding. */
export function mannequinPreviewHeightPct(
  mannequin: Pick<Mannequin, 'scale' | 'age' | 'ageScale' | 'angle' | 'gender' | 'pose'>,
): number {
  const trim = mannequinTrim(mannequinVariantFrom(mannequin));
  return mannequinVisualHeightPct(mannequin) / trim.contentHeightRatio;
}

export interface MannequinPreviewTransform {
  /** Horizontal shift so feet center lands on placement x. */
  translateX: string;
  transformOrigin: string;
  feetLeftPct: number;
}

/** Feet-anchored CSS — pair with bottom: (1 - y) * 100%. */
export function mannequinPreviewTransform(
  mannequin: Pick<Mannequin, 'gender' | 'age' | 'pose' | 'angle'>,
): MannequinPreviewTransform {
  const trim = mannequinTrim(mannequinVariantFrom(mannequin));
  const feetLeftPct = trim.feetCenterX * 100;
  return {
    translateX: `calc(-${feetLeftPct}% + 0%)`,
    transformOrigin: `${feetLeftPct}% 100%`,
    feetLeftPct,
  };
}

/** CSS bottom % for feet anchor (y=1 → bottom edge; y>1 → feet below frame). */
export function mannequinFeetBottomPct(y: number): number {
  return (1 - y) * 100;
}

export interface MannequinDrawSize {
  width: number;
  height: number;
}

export interface MannequinDrawLayout extends MannequinDrawSize {
  /** Draw offset so visual feet align with anchor (cx, cy). */
  offsetX: number;
  offsetY: number;
}

/** Pixel draw size for canvas bake — visual feet anchor at (cx, cy). */
export function mannequinDrawLayout(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
  mannequin: Pick<Mannequin, 'scale' | 'age' | 'ageScale' | 'angle' | 'gender' | 'pose'>,
): MannequinDrawLayout {
  const trim = mannequinTrim(mannequinVariantFrom(mannequin));
  const base = Math.min(frameWidth, frameHeight) * MANNEQUIN_BASE_HEIGHT_RATIO;
  const scale = effectiveMannequinScale(mannequin);
  const visualHeight = base * scale;
  const height = visualHeight / trim.contentHeightRatio;
  const width = imageHeight > 0 ? height * (imageWidth / imageHeight) : height;
  return {
    width,
    height,
    offsetX: -trim.feetCenterX * width,
    offsetY: -(1 - trim.paddingBottom) * height,
  };
}

/** @deprecated Use mannequinDrawLayout */
export function mannequinDrawSize(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
  mannequin: Pick<Mannequin, 'scale' | 'age' | 'ageScale' | 'angle' | 'gender' | 'pose'>,
): MannequinDrawSize {
  const { width, height } = mannequinDrawLayout(
    frameWidth,
    frameHeight,
    imageWidth,
    imageHeight,
    mannequin,
  );
  return { width, height };
}

export interface AnchorDragInput {
  originScale: number;
  anchorX: number;
  anchorY: number;
  /** Pointer-to-feet distance captured at drag start (px). */
  startAnchorDist: number;
  currentClientX: number;
  currentClientY: number;
  layerRect: DOMRect;
}

/** Minimum baseline (px) when the handle starts very close to the feet anchor. */
export const MANNEQUIN_SCALE_MIN_ANCHOR_DIST = 40;

export function feetAnchorClientPx(
  anchorX: number,
  anchorY: number,
  layerRect: DOMRect,
): { x: number; y: number } {
  return {
    x: layerRect.left + anchorX * layerRect.width,
    y: layerRect.top + anchorY * layerRect.height,
  };
}

export function pointerDistanceToFeetAnchor(
  clientX: number,
  clientY: number,
  anchorX: number,
  anchorY: number,
  layerRect: DOMRect,
): number {
  const anchor = feetAnchorClientPx(anchorX, anchorY, layerRect);
  return Math.hypot(clientX - anchor.x, clientY - anchor.y);
}

/**
 * Scale from pointer distance to feet anchor.
 * Handle sits away from the feet (top of figure) so pull-to-resize is stable under rotation.
 */
export function scaleFromAnchorDrag(input: AnchorDragInput): number {
  const startDist = Math.max(input.startAnchorDist, MANNEQUIN_SCALE_MIN_ANCHOR_DIST);
  const currentDist = pointerDistanceToFeetAnchor(
    input.currentClientX,
    input.currentClientY,
    input.anchorX,
    input.anchorY,
    input.layerRect,
  );
  return clampMannequinScale(input.originScale * (currentDist / startDist));
}

export interface MoveDragInput {
  originX: number;
  originY: number;
  startClientX: number;
  startClientY: number;
  currentClientX: number;
  currentClientY: number;
  layerRect: DOMRect;
  /** Scale-aware ceiling for feet Y — pass maxFeetAnchorY(mannequin) during drag. */
  maxAnchorY?: number;
}

export function positionFromMoveDrag(input: MoveDragInput): { x: number; y: number } {
  const dx = (input.currentClientX - input.startClientX) / input.layerRect.width;
  const dy = (input.currentClientY - input.startClientY) / input.layerRect.height;
  return clampMannequinAnchor(
    {
      x: input.originX + dx,
      y: input.originY + dy,
    },
    { maxY: input.maxAnchorY },
  );
}

/** Angle (degrees) from feet anchor to a client pointer position. */
export function pointerAngleFromFeetAnchor(
  clientX: number,
  clientY: number,
  anchorX: number,
  anchorY: number,
  layerRect: DOMRect,
): number {
  const anchor = feetAnchorClientPx(anchorX, anchorY, layerRect);
  return (Math.atan2(clientY - anchor.y, clientX - anchor.x) * 180) / Math.PI;
}

export interface TiltDragInput {
  originRotation: number;
  anchorX: number;
  anchorY: number;
  startAngleDeg: number;
  currentClientX: number;
  currentClientY: number;
  layerRect: DOMRect;
}

/** Tilt by dragging a top handle — rotation pivots at the feet anchor. */
export function rotationFromTiltDrag(input: TiltDragInput): number {
  const currentAngle = pointerAngleFromFeetAnchor(
    input.currentClientX,
    input.currentClientY,
    input.anchorX,
    input.anchorY,
    input.layerRect,
  );
  return Math.round(input.originRotation + (currentAngle - input.startAngleDeg));
}