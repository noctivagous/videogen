import {
  applyAgeScale,
  mannequinEffectiveAgeScale,
  mannequinTrim,
  mannequinVariantFrom,
} from '@/lib/constants/mannequin-assets';
import type { Mannequin, MannequinAngle } from '@/lib/types/studio';

/** Figure height as fraction of frame height at scale=1 — matches bake canvas base. */
export const MANNEQUIN_BASE_HEIGHT_RATIO = 0.55;

export const MANNEQUIN_SCALE_MIN = 0.1;
export const MANNEQUIN_SCALE_MAX = 2.5;

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

/** CSS bottom % so visual feet sit at normalized y (0 = top, 1 = bottom). */
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
}

export function positionFromMoveDrag(input: MoveDragInput): { x: number; y: number } {
  const dx = (input.currentClientX - input.startClientX) / input.layerRect.width;
  const dy = (input.currentClientY - input.startClientY) / input.layerRect.height;
  return {
    x: Math.min(1, Math.max(0, input.originX + dx)),
    y: Math.min(1, Math.max(0, input.originY + dy)),
  };
}