import type { CameraSettings, LensType } from '@/lib/types/studio';

export interface LensPreset {
  label: string;
  min: number;
  max: number;
  default: number;
  promptHint: string;
}

/** Canonical defaults when a lens is picked from the dropdown. */
export const LENS_PRESETS: Record<LensType, LensPreset> = {
  fisheye: { label: 'Fisheye', min: 8, max: 16, default: 12, promptHint: 'fisheye' },
  wide: { label: 'Wide Angle', min: 14, max: 35, default: 24, promptHint: 'wide-angle' },
  standard: { label: 'Standard', min: 35, max: 70, default: 50, promptHint: 'standard' },
  anamorphic: { label: 'Anamorphic', min: 40, max: 75, default: 50, promptHint: 'anamorphic' },
  telephoto: { label: 'Telephoto', min: 70, max: 200, default: 85, promptHint: 'telephoto' },
  macro: { label: 'Macro', min: 90, max: 105, default: 100, promptHint: 'macro' },
};

/** Non-overlapping focal-length bands — moving the slider updates the Lens dropdown. */
export const FOCAL_LENGTH_BANDS: { min: number; max: number; lensType: LensType }[] = [
  { min: 8, max: 16, lensType: 'fisheye' },
  { min: 17, max: 35, lensType: 'wide' },
  { min: 36, max: 70, lensType: 'standard' },
  { min: 71, max: 89, lensType: 'telephoto' },
  { min: 90, max: 105, lensType: 'macro' },
  { min: 106, max: 200, lensType: 'telephoto' },
];

/** Tick marks at each band boundary (slider steps align to lens zones). */
export const FOCAL_LENGTH_TICKS = [8, 17, 36, 71, 90, 106, 200] as const;

/** Real-world prime / zoom-stop focal lengths available in retail lenses (8–200mm). */
export const RETAIL_FOCAL_LENGTHS = [
  8, 10, 12, 14, 16, 18, 20, 21, 24, 28, 32, 35, 40, 45, 50, 55, 58, 65, 70, 75, 85, 90, 95,
  100, 105, 120, 135, 150, 180, 200,
] as const;

export const GLOBAL_FOCAL_MIN = RETAIL_FOCAL_LENGTHS[0];
export const GLOBAL_FOCAL_MAX = RETAIL_FOCAL_LENGTHS[RETAIL_FOCAL_LENGTHS.length - 1];

export function snapToRetailFocalLength(mm: number): number {
  const clamped = Math.min(GLOBAL_FOCAL_MAX, Math.max(GLOBAL_FOCAL_MIN, mm));
  let nearest: number = RETAIL_FOCAL_LENGTHS[0];
  let minDist = Infinity;
  for (const focal of RETAIL_FOCAL_LENGTHS) {
    const dist = Math.abs(focal - clamped);
    if (dist < minDist) {
      minDist = dist;
      nearest = focal;
    }
  }
  return nearest;
}

export function retailFocalLengthIndex(mm: number): number {
  const snapped = snapToRetailFocalLength(mm);
  const idx = RETAIL_FOCAL_LENGTHS.indexOf(snapped as (typeof RETAIL_FOCAL_LENGTHS)[number]);
  return idx >= 0 ? idx : RETAIL_FOCAL_LENGTHS.indexOf(50);
}

export function clampGlobalFocalLength(mm: number): number {
  return snapToRetailFocalLength(mm);
}

/** Anamorphic is kept while focal length stays in 40–75mm if already selected. */
export function lensTypeFromFocalLength(mm: number, currentType?: LensType): LensType {
  const clamped = clampGlobalFocalLength(mm);
  if (currentType === 'anamorphic' && clamped >= 40 && clamped <= 75) {
    return 'anamorphic';
  }
  const band = FOCAL_LENGTH_BANDS.find((b) => clamped >= b.min && clamped <= b.max);
  return band?.lensType ?? 'standard';
}

/**
 * Slider changes derive lens type from focal band.
 * Dropdown changes jump focal length to that lens's default.
 */
export function applyLensCameraPatch(
  current: CameraSettings,
  patch: Partial<CameraSettings>,
): Partial<CameraSettings> {
  const merged = { ...patch };
  const fromDropdown = merged.lensType !== undefined && merged.focalLength === undefined;
  const fromSlider = merged.focalLength !== undefined && merged.lensType === undefined;

  if (fromDropdown) {
    const preset = LENS_PRESETS[merged.lensType as LensType];
    merged.focalLength = preset.default;
    return merged;
  }

  if (merged.focalLength !== undefined) {
    merged.focalLength = clampGlobalFocalLength(merged.focalLength);
    if (fromSlider) {
      merged.lensType = lensTypeFromFocalLength(merged.focalLength, current.lensType);
    } else if (merged.lensType !== undefined) {
      merged.lensType = lensTypeFromFocalLength(merged.focalLength, merged.lensType as LensType);
    } else {
      merged.lensType = lensTypeFromFocalLength(merged.focalLength, current.lensType);
    }
    return merged;
  }

  return merged;
}

export function formatLensLabel(camera: CameraSettings): string {
  const preset = LENS_PRESETS[camera.lensType];
  return `${preset.label} · ${camera.focalLength}mm`;
}

export function formatLensForPrompt(camera: CameraSettings): string {
  const preset = LENS_PRESETS[camera.lensType];
  return `${camera.focalLength}mm ${preset.promptHint} lens, f/${camera.aperture}, ${camera.dof} depth of field`;
}

export function normalizeLensCamera(camera: CameraSettings): CameraSettings {
  const focalLength = clampGlobalFocalLength(camera.focalLength || LENS_PRESETS.standard.default);
  const lensType =
    camera.lensType in LENS_PRESETS
      ? lensTypeFromFocalLength(focalLength, camera.lensType)
      : lensTypeFromFocalLength(focalLength);
  return { ...camera, lensType, focalLength };
}