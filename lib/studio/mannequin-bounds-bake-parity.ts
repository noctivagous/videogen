/**
 * Spot-check that feet-anchor storage + mannequinDrawLayout (bake canvas) agree with
 * relational bounds insets from anchorToBoundsFrame.
 */
import { mannequinVariantFrom } from '@/lib/constants/mannequin-assets';
import { effectiveMannequinScale, MANNEQUIN_BASE_HEIGHT_RATIO } from '@/lib/studio/mannequin-layout';
import {
  anchorToBoundsFrame,
  boundsFrameToAnchor,
  type MannequinBoundsFrame,
} from '@/lib/studio/mannequin-bounds-framing';
import { mannequinDrawLayout } from '@/lib/studio/mannequin-layout';
import type { AspectRatio, Mannequin } from '@/lib/types/studio';

/** Standard 16:9 bake resolution for parity checks. */
export const BAKE_PARITY_FRAME_WIDTH = 1920;
export const BAKE_PARITY_FRAME_HEIGHT = 1080;

const MANNEQUIN_MASTER_WIDTH = 321;
const MANNEQUIN_MASTER_HEIGHT = 1023;

function parseAspect(aspectRatio: AspectRatio): number {
  const [w, h] = aspectRatio.split(':').map(Number);
  return w / h;
}

/**
 * Content-bounds insets derived from bake draw layout (same path as bake-start-frame.ts).
 * Uses trim-aware top; feet anchor is bounds bottom.
 */
export function bakeContentInsetsFromAnchor(
  mannequin: Pick<Mannequin, 'x' | 'y' | 'scale' | 'gender' | 'age' | 'pose' | 'angle' | 'ageScale'>,
  aspectRatio: AspectRatio = '16:9',
  frameWidth = BAKE_PARITY_FRAME_WIDTH,
  frameHeight = BAKE_PARITY_FRAME_HEIGHT,
): MannequinBoundsFrame {
  const { width: drawW, height: drawH, offsetX, offsetY } = mannequinDrawLayout(
    frameWidth,
    frameHeight,
    MANNEQUIN_MASTER_WIDTH,
    MANNEQUIN_MASTER_HEIGHT,
    mannequin,
  );

  const pngLeft = (mannequin.x * frameWidth + offsetX) / frameWidth;
  const pngWidth = drawW / frameWidth;
  const visualHeight = MANNEQUIN_BASE_HEIGHT_RATIO * effectiveMannequinScale(mannequin);
  const contentTop = mannequin.y - visualHeight;
  const contentBottom = mannequin.y;
  const contentLeft = pngLeft;
  const contentRight = pngLeft + pngWidth;

  const aspect = parseAspect(aspectRatio);
  return {
    insetLeft: contentLeft,
    insetRight: 1 - contentRight,
    insetTop: contentTop,
    insetBottom: 1 - contentBottom,
    widthToFrameHeight: pngWidth * aspect,
  };
}

export interface BakeParityResult {
  fieldSize: string;
  boundsFromAnchor: MannequinBoundsFrame;
  boundsFromBakeDraw: MannequinBoundsFrame;
  maxInsetDelta: number;
}

/** Compare anchorToBoundsFrame vs bake draw layout for a resolved field-size mannequin. */
export function checkBakeParity(input: {
  mannequin: Pick<Mannequin, 'x' | 'y' | 'scale' | 'gender' | 'age' | 'pose' | 'angle' | 'ageScale'>;
  aspectRatio?: AspectRatio;
  placementX?: number;
  fieldSizeLabel: string;
}): BakeParityResult {
  const aspectRatio = input.aspectRatio ?? '16:9';
  const placementX = input.placementX ?? 0.5;
  const boundsFromAnchor = anchorToBoundsFrame(input.mannequin, aspectRatio, placementX);
  const boundsFromBakeDraw = bakeContentInsetsFromAnchor(
    input.mannequin,
    aspectRatio,
    BAKE_PARITY_FRAME_WIDTH,
    BAKE_PARITY_FRAME_HEIGHT,
  );
  if (placementX !== 0.5) {
    boundsFromBakeDraw.insetLeft -= placementX - 0.5;
    boundsFromBakeDraw.insetRight += placementX - 0.5;
  }

  const deltas = [
    Math.abs(boundsFromAnchor.insetLeft - boundsFromBakeDraw.insetLeft),
    Math.abs(boundsFromAnchor.insetRight - boundsFromBakeDraw.insetRight),
    Math.abs(boundsFromAnchor.insetTop - boundsFromBakeDraw.insetTop),
    Math.abs(boundsFromAnchor.insetBottom - boundsFromBakeDraw.insetBottom),
    Math.abs(boundsFromAnchor.widthToFrameHeight - boundsFromBakeDraw.widthToFrameHeight),
  ];

  return {
    fieldSize: input.fieldSizeLabel,
    boundsFromAnchor,
    boundsFromBakeDraw,
    maxInsetDelta: Math.max(...deltas),
  };
}

/** Round-trip + bake draw parity for a preset-derived anchor. */
export function checkPresetBakeParity(input: {
  bounds: MannequinBoundsFrame;
  mannequin: Pick<Mannequin, 'gender' | 'age' | 'pose' | 'angle'>;
  aspectRatio?: AspectRatio;
  placementX?: number;
  fieldSizeLabel: string;
}): BakeParityResult {
  const aspectRatio = input.aspectRatio ?? '16:9';
  const placementX = input.placementX ?? 0.5;
  const anchor = boundsFrameToAnchor(input.bounds, mannequinVariantFrom(input.mannequin), aspectRatio, placementX);
  return checkBakeParity({
    mannequin: { ...anchor, ...input.mannequin },
    aspectRatio,
    placementX,
    fieldSizeLabel: input.fieldSizeLabel,
  });
}

