import { boundsPresetForVariant } from '@/lib/constants/mannequin-bounds-presets';
import {
  MANNEQUIN_BOUNDS_REFERENCE_ASPECT,
  MANNEQUIN_BOUNDS_REFERENCE_PLACEMENT_X,
} from '@/lib/studio/mannequin-bounds-contract';
import {
  mannequinTrim,
  mannequinVariantFrom,
  type MannequinTrim,
  type MannequinVariant,
} from '@/lib/constants/mannequin-assets';
import { HEADROOM_Y_OFFSET } from '@/lib/constants/framing';
import {
  MANNEQUIN_BASE_HEIGHT_RATIO,
  MANNEQUIN_SCALE_MAX,
  clampMannequinAnchor,
  clampMannequinScale,
  effectiveMannequinScale,
  maxFeetAnchorY,
} from '@/lib/studio/mannequin-layout';
import type { AspectRatio, FieldSize, Headroom, Mannequin } from '@/lib/types/studio';

/** Master PNG width ÷ height — assets are generated at a fixed portrait aspect. */
export const MANNEQUIN_ASSET_ASPECT_RATIO = 321 / 1023;

/**
 * Relational frame fit: inset distances from each bounds edge to the matching frame edge,
 * plus bounds width expressed relative to frame height.
 *
 * Full contract: lib/studio/mannequin-bounds-contract.ts
 * Bake parity: lib/studio/mannequin-bounds-bake-parity.ts
 */
export interface MannequinBoundsFrame {
  /** Frame left → bounds left (fraction of frame width). */
  insetLeft: number;
  /** Frame right → bounds right (fraction of frame width). */
  insetRight: number;
  /** Frame top → bounds top (fraction of frame height). */
  insetTop: number;
  /**
   * Frame bottom → bounds bottom (fraction of frame height).
   * Negative when feet sit below the frame (close-ups).
   */
  insetBottom: number;
  /** Bounds width ÷ frame height (pixel ratio; equals boundsWidthFrac × aspect). */
  widthToFrameHeight: number;
}

/** CSS inset positioning for the alpha-content bounds box in the preview frame. */
export function boundsFrameToInsetStyle(bounds: MannequinBoundsFrame): {
  left: string;
  top: string;
  right: string;
  bottom: string;
} {
  return {
    left: `${bounds.insetLeft * 100}%`,
    top: `${bounds.insetTop * 100}%`,
    right: `${bounds.insetRight * 100}%`,
    bottom: `${bounds.insetBottom * 100}%`,
  };
}

/**
 * Absolute frame-space bounds for preview overlays — matches on-screen mannequin layout.
 * Inspector bounds use placementAnchorX to cancel grid shift; overlays must not.
 */
export function previewBoundsFrameFromMannequin(
  mannequin: Pick<Mannequin, 'x' | 'y' | 'scale' | 'gender' | 'age' | 'pose' | 'angle' | 'ageScale'>,
  aspectRatio: AspectRatio = '16:9',
): MannequinBoundsFrame {
  return anchorToBoundsFrame(
    mannequin,
    aspectRatio,
    MANNEQUIN_BOUNDS_REFERENCE_PLACEMENT_X,
  );
}

export function parseAspectRatio(aspectRatio: AspectRatio | string): number {
  const [w, h] = String(aspectRatio).split(':').map(Number);
  if (!w || !h) return 16 / 9;
  return w / h;
}

function defaultVariant(): MannequinVariant {
  return { gender: 'male', age: 'adult', pose: 'standard', angle: 'front' };
}

function boundsWidthFrac(bounds: MannequinBoundsFrame, aspect: number): number {
  return bounds.widthToFrameHeight / aspect;
}

function boundsHeightFrac(bounds: MannequinBoundsFrame): number {
  return 1 - bounds.insetTop - bounds.insetBottom;
}

/** Visual scale from bounds width ÷ frame height — matches anchorToBoundsFrame inverse. */
export function scaleFromWidthToFrameHeight(
  widthToFrameHeight: number,
  trim: MannequinTrim,
): number {
  return (
    (widthToFrameHeight * trim.contentHeightRatio) /
    (MANNEQUIN_BASE_HEIGHT_RATIO * MANNEQUIN_ASSET_ASPECT_RATIO)
  );
}

/** Maximum achievable W÷H for a variant at MANNEQUIN_SCALE_MAX. */
export function maxWidthToFrameHeight(trim: MannequinTrim): number {
  return (
    (MANNEQUIN_SCALE_MAX * MANNEQUIN_BASE_HEIGHT_RATIO * MANNEQUIN_ASSET_ASPECT_RATIO) /
    trim.contentHeightRatio
  );
}

function visualHeightFromWidth(
  widthToFrameHeight: number,
  trim: MannequinTrim,
): number {
  return MANNEQUIN_BASE_HEIGHT_RATIO * scaleFromWidthToFrameHeight(widthToFrameHeight, trim);
}

/** Frame-top → alpha content top (matches mannequinDrawLayout / bake canvas). */
function insetTopFromFeetY(feetY: number, visualHeight: number): number {
  return feetY - visualHeight;
}

/** Feet anchor Y that places content top at insetTop. */
function feetYFromInsetTop(insetTop: number, visualHeight: number): number {
  return insetTop + visualHeight;
}

/** Vertical span from content top down to the feet anchor. */
function contentSpanToFeet(visualHeight: number): number {
  return visualHeight;
}

function syncBoundsVerticalInsets(
  bounds: MannequinBoundsFrame,
  trim: MannequinTrim,
): MannequinBoundsFrame {
  const span = contentSpanToFeet(visualHeightFromWidth(bounds.widthToFrameHeight, trim));
  return {
    ...bounds,
    insetBottom: 1 - bounds.insetTop - span,
  };
}

function pngWidthFrac(
  boundsHeight: number,
  trim: ReturnType<typeof mannequinTrim>,
  aspect: number,
): number {
  const pngHeight = boundsHeight / trim.contentHeightRatio;
  return (pngHeight * MANNEQUIN_ASSET_ASPECT_RATIO) / aspect;
}

function applyHeadroomToBounds(
  bounds: MannequinBoundsFrame,
  headroom: Headroom,
): MannequinBoundsFrame {
  const headroomNudge = -(HEADROOM_Y_OFFSET[headroom] ?? 0) * 0.003;
  return {
    ...bounds,
    insetTop: bounds.insetTop - headroomNudge,
    insetBottom: bounds.insetBottom + headroomNudge,
  };
}

function boundsFromPreset(
  preset: Pick<MannequinBoundsFrame, 'insetLeft' | 'insetTop' | 'widthToFrameHeight'>,
  aspect: number,
  trim: MannequinTrim,
): MannequinBoundsFrame {
  const widthFrac = preset.widthToFrameHeight / aspect;
  return syncBoundsVerticalInsets(
    {
      insetLeft: preset.insetLeft,
      insetRight: 1 - preset.insetLeft - widthFrac,
      insetTop: preset.insetTop,
      insetBottom: 0,
      widthToFrameHeight: preset.widthToFrameHeight,
    },
    trim,
  );
}

/** @deprecated Use MANNEQUIN_BOUNDS_REFERENCE_PLACEMENT_X from mannequin-bounds-contract.ts */
export const PRESET_REFERENCE_PLACEMENT_X = MANNEQUIN_BOUNDS_REFERENCE_PLACEMENT_X;

function placementShiftX(anchorX: number): number {
  return anchorX - PRESET_REFERENCE_PLACEMENT_X;
}

/**
 * Default relational bounds for a field size — always from per-demographic presets
 * in mannequin-bounds-presets.ts (tune there; regenerate via scripts/generate-mannequin-bounds-presets.ts).
 */
export function defaultBoundsForFieldSize(
  fieldSize: FieldSize,
  headroom: Headroom = 'normal',
  _anchorX = PRESET_REFERENCE_PLACEMENT_X,
  aspectRatio: AspectRatio = '16:9',
  variant: MannequinVariant = defaultVariant(),
): MannequinBoundsFrame {
  const aspect = parseAspectRatio(aspectRatio);
  const trim = mannequinTrim(variant);
  const preset = boundsPresetForVariant(
    fieldSize,
    variant.gender,
    variant.age,
    variant.angle,
  );
  return applyHeadroomToBounds(boundsFromPreset(preset, aspect, trim), headroom);
}

/** Convert relational bounds to feet-anchor x/y/scale (storage format). */
export function boundsFrameToAnchor(
  bounds: MannequinBoundsFrame,
  variant: MannequinVariant = defaultVariant(),
  aspectRatio: AspectRatio = '16:9',
  anchorX = PRESET_REFERENCE_PLACEMENT_X,
): { x: number; y: number; scale: number } {
  const trim = mannequinTrim(variant);
  const aspect = parseAspectRatio(aspectRatio);
  const synced = syncBoundsVerticalInsets(bounds, trim);
  const width = boundsWidthFrac(synced, aspect);
  const height = visualHeightFromWidth(synced.widthToFrameHeight, trim);

  const scale = clampMannequinScale(scaleFromWidthToFrameHeight(synced.widthToFrameHeight, trim));
  const y = clampMannequinAnchor(
    { x: 0.5, y: feetYFromInsetTop(synced.insetTop, height) },
    { maxY: maxFeetAnchorY({ scale }) },
  ).y;
  const x = synced.insetLeft + trim.feetCenterX * width + placementShiftX(anchorX);

  return { x, y, scale };
}

/** Convert feet-anchor placement to relational bounds. */
export function anchorToBoundsFrame(
  mannequin: Pick<Mannequin, 'x' | 'y' | 'scale' | 'gender' | 'age' | 'pose' | 'angle' | 'ageScale'>,
  aspectRatio: AspectRatio = '16:9',
  anchorX = PRESET_REFERENCE_PLACEMENT_X,
): MannequinBoundsFrame {
  const variant = mannequinVariantFrom(mannequin);
  const trim = mannequinTrim(variant);
  const aspect = parseAspectRatio(aspectRatio);

  const height = MANNEQUIN_BASE_HEIGHT_RATIO * effectiveMannequinScale(mannequin);
  const width = pngWidthFrac(height, trim, aspect);
  const insetBottom = 1 - mannequin.y;
  const insetTop = insetTopFromFeetY(mannequin.y, height);
  const insetLeft = mannequin.x - trim.feetCenterX * width - placementShiftX(anchorX);

  return {
    insetLeft,
    insetRight: 1 - insetLeft - width,
    insetTop,
    insetBottom,
    widthToFrameHeight: width * aspect,
  };
}

export function isNearBoundsDefault(
  bounds: MannequinBoundsFrame,
  reference: MannequinBoundsFrame,
  threshold = 0.05,
): boolean {
  const dLeft = bounds.insetLeft - reference.insetLeft;
  const dRight = bounds.insetRight - reference.insetRight;
  const dTop = bounds.insetTop - reference.insetTop;
  const dBottom = bounds.insetBottom - reference.insetBottom;
  const dWidth = bounds.widthToFrameHeight - reference.widthToFrameHeight;
  return Math.hypot(dLeft, dRight, dTop, dBottom, dWidth) < threshold;
}

/** Merge a partial bounds edit and keep width/insets consistent. */
export function patchBoundsFrame(
  bounds: MannequinBoundsFrame,
  patch: Partial<MannequinBoundsFrame>,
  aspectRatio: AspectRatio = '16:9',
  trim?: MannequinTrim,
): MannequinBoundsFrame {
  const aspect = parseAspectRatio(aspectRatio);
  const next: MannequinBoundsFrame = { ...bounds, ...patch };

  if (patch.widthToFrameHeight !== undefined) {
    const widthFrac = next.widthToFrameHeight / aspect;
    next.insetRight = 1 - next.insetLeft - widthFrac;
  } else if (patch.insetLeft !== undefined && patch.insetRight === undefined) {
    const widthFrac = bounds.widthToFrameHeight / aspect;
    next.insetRight = 1 - next.insetLeft - widthFrac;
  } else if (patch.insetRight !== undefined && patch.insetLeft === undefined) {
    const widthFrac = bounds.widthToFrameHeight / aspect;
    next.insetLeft = 1 - next.insetRight - widthFrac;
  } else if (patch.insetLeft !== undefined || patch.insetRight !== undefined) {
    const widthFrac = 1 - next.insetLeft - next.insetRight;
    next.widthToFrameHeight = widthFrac * aspect;
  }

  if (
    trim &&
    (patch.widthToFrameHeight !== undefined ||
      patch.insetTop !== undefined ||
      patch.insetLeft !== undefined ||
      patch.insetRight !== undefined)
  ) {
    return syncBoundsVerticalInsets(next, trim);
  }

  return next;
}

export function boundsFrameToMannequinPatch(
  bounds: MannequinBoundsFrame,
  mannequin: Pick<Mannequin, 'gender' | 'age' | 'pose' | 'angle'>,
  aspectRatio: AspectRatio = '16:9',
  anchorX = PRESET_REFERENCE_PLACEMENT_X,
): Pick<Mannequin, 'x' | 'y' | 'scale'> {
  return boundsFrameToAnchor(bounds, mannequinVariantFrom(mannequin), aspectRatio, anchorX);
}

/** Anchor + scale from field-size relational bounds defaults. */
export function fieldSizeAnchor(
  fieldSize: FieldSize,
  headroom: Headroom,
  anchorX: number,
  aspectRatio: AspectRatio = '16:9',
  variant?: MannequinVariant,
): { x: number; y: number; scale: number } {
  const bounds = defaultBoundsForFieldSize(fieldSize, headroom, anchorX, aspectRatio, variant);
  return boundsFrameToAnchor(bounds, variant ?? defaultVariant(), aspectRatio, anchorX);
}