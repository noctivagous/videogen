/**
 * Canonical contract for mannequin relational bounds framing.
 *
 * ## Two coordinate representations
 *
 * **Storage (Mannequin x/y/scale)** — feet anchor in normalized frame space:
 * - x: 0 = left, 1 = right (feet center on silhouette)
 * - y: 0 = top, 1 = frame bottom, >1 = feet below frame (CU/ECU)
 * - scale: visual height multiplier at MANNEQUIN_BASE_HEIGHT_RATIO
 *
 * **Inspector (MannequinBoundsFrame)** — inset distances from each frame edge to the
 * alpha content box (same vertical span as bake canvas draw layout):
 * - insetLeft/Right/Top/Bottom: fraction of frame width (L/R) or height (T/B)
 * - widthToFrameHeight: content width ÷ frame height (drives scale)
 *
 * Convert with boundsFrameToAnchor / anchorToBoundsFrame in mannequin-bounds-framing.ts.
 *
 * ## Placement vs bounds
 *
 * Placement grid X shifts feet anchor x only (PRESET_REFERENCE_PLACEMENT_X = 0.5).
 * Bounds insets are placement-independent framing values shown in the inspector.
 *
 * ## Preset table key shape
 *
 * Today (front-facing, eye-level camera, 16:9 authoring):
 *   fieldSize → gender-age → bounds
 *
 * Near-term (per-facing trim / feetCenterX):
 *   fieldSize → gender-age → mannequinFacing → bounds
 *
 * Long-term (generated art per camera position):
 *   fieldSize → gender-age → mannequinFacing → cameraAngle → bounds
 *
 * MannequinAngle = which PNG facing (front, threeQuarterLeft, …).
 * CameraAngle = where the camera sits (eye-level, high-angle, …) — affects backdrop
 * preview transforms today; bounds table uses eye-level placeholder until per-angle
 * mannequin art exists.
 *
 * Tune hand values in scripts/generate-mannequin-bounds-presets.ts (TUNED_FIELD_PRESETS),
 * then run npm run generate:mannequin-bounds-presets.
 */

import type { AspectRatio, CameraAngle, FieldSize, MannequinAge, MannequinGender, MannequinAngle } from '@/lib/types/studio';
import type { MannequinBoundsFrame } from '@/lib/studio/mannequin-bounds-framing';

/** Aspect ratio presets were measured and tuned against. */
export const MANNEQUIN_BOUNDS_REFERENCE_ASPECT: AspectRatio = '16:9';

/** Placement grid X presets and cutout measurement assume center column. */
export const MANNEQUIN_BOUNDS_REFERENCE_PLACEMENT_X = 0.5;

/** Default facing row in the preset table (only row populated today). */
export const MANNEQUIN_BOUNDS_DEFAULT_FACING: MannequinAngle = 'front';

/**
 * Placeholder camera-angle axis for future per-angle mannequin art.
 * Does not alter bounds lookup until camera-specific assets are authored.
 */
export const MANNEQUIN_BOUNDS_DEFAULT_CAMERA_ANGLE: CameraAngle = 'eye-level';

/**
 * How non-reference aspects resolve presets today.
 * - reference-presets: same inset numbers; width/height math uses live aspect ratio
 * - (future) per-aspect tables when 9:16 presets are tuned
 */
export type MannequinBoundsAspectStrategy = 'reference-presets';

export const MANNEQUIN_BOUNDS_ASPECT_STRATEGY: MannequinBoundsAspectStrategy = 'reference-presets';

export type MannequinDemographicKey = `${MannequinGender}-${MannequinAge}`;

/** Near-term preset path (facing populated; camera angle reserved). */
export type MannequinBoundsPresetPath = {
  fieldSize: FieldSize;
  demographic: MannequinDemographicKey;
  facing: MannequinAngle;
  /** Reserved — eye-level only until camera-angle art ships. */
  cameraAngle: CameraAngle;
};

export type MannequinBoundsPreset = Pick<
  MannequinBoundsFrame,
  'insetLeft' | 'insetTop' | 'widthToFrameHeight'
>;

export function isBoundsAuthoringAspect(aspectRatio: AspectRatio): boolean {
  return aspectRatio === MANNEQUIN_BOUNDS_REFERENCE_ASPECT;
}

/** True when callers should warn that framing is not yet tuned for this aspect. */
export function boundsAspectNeedsRetuning(aspectRatio: AspectRatio): boolean {
  return MANNEQUIN_BOUNDS_ASPECT_STRATEGY === 'reference-presets' && !isBoundsAuthoringAspect(aspectRatio);
}

export function mannequinDemographicKey(gender: MannequinGender, age: MannequinAge): MannequinDemographicKey {
  return `${gender}-${age}`;
}