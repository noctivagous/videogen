import { LENS_PRESETS } from '@/lib/constants/lens';
import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import type { LensType } from '@/lib/types/studio';

const ALL_LENS_TYPES: LensType[] = [
  'fisheye',
  'wide',
  'standard',
  'anamorphic',
  'telephoto',
  'macro',
];

export function lensThumbnail(lensType: LensType): string {
  return `/stock/lenses/${lensType}.jpg`;
}

export const LENS_OPTIONS: VisualDropdownOption<LensType>[] = ALL_LENS_TYPES.map((value) => {
  const preset = LENS_PRESETS[value];
  return {
    value,
    label: `${preset.label} (${preset.min}–${preset.max}mm)`,
    shortLabel: preset.label,
    imageUrl: lensThumbnail(value),
  };
});