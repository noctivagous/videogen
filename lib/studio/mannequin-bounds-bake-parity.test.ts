import { describe, expect, it } from 'vitest';
import type { MannequinVariant } from '@/lib/constants/mannequin-assets';
import {
  boundsAspectNeedsRetuning,
  isBoundsAuthoringAspect,
  MANNEQUIN_BOUNDS_DEFAULT_CAMERA_ANGLE,
  MANNEQUIN_BOUNDS_DEFAULT_FACING,
  MANNEQUIN_BOUNDS_REFERENCE_ASPECT,
} from '@/lib/studio/mannequin-bounds-contract';
import { defaultBoundsForFieldSize } from '@/lib/studio/mannequin-bounds-framing';
import { checkPresetBakeParity } from '@/lib/studio/mannequin-bounds-bake-parity';
import type { FieldSize, MannequinAge, MannequinGender } from '@/lib/types/studio';

const PARITY_EPS = 1e-4;

function variant(
  gender: MannequinGender = 'male',
  age: MannequinAge = 'adult',
): MannequinVariant {
  return { gender, age, pose: 'standard', angle: 'front' };
}

describe('mannequin bounds aspect strategy', () => {
  it('presets are authored at 16:9', () => {
    expect(MANNEQUIN_BOUNDS_REFERENCE_ASPECT).toBe('16:9');
    expect(isBoundsAuthoringAspect('16:9')).toBe(true);
    expect(isBoundsAuthoringAspect('9:16')).toBe(false);
    expect(boundsAspectNeedsRetuning('9:16')).toBe(true);
    expect(boundsAspectNeedsRetuning('16:9')).toBe(false);
  });
});

describe('mannequin bounds preset axis placeholders', () => {
  it('defaults to front facing and eye-level camera angle', () => {
    expect(MANNEQUIN_BOUNDS_DEFAULT_FACING).toBe('front');
    expect(MANNEQUIN_BOUNDS_DEFAULT_CAMERA_ANGLE).toBe('eye-level');
  });
});

describe('mannequin bounds bake parity at 16:9', () => {
  it.each(['cu', 'ms'] as const)(
    '%s preset anchor matches bake draw layout insets',
    (fieldSize: FieldSize) => {
      const mannequinVariant = variant();
      const bounds = defaultBoundsForFieldSize(fieldSize, 'normal', 0.5, '16:9', mannequinVariant);
      const result = checkPresetBakeParity({
        bounds,
        mannequin: mannequinVariant,
        aspectRatio: '16:9',
        placementX: 0.5,
        fieldSizeLabel: fieldSize,
      });
      expect(result.maxInsetDelta).toBeLessThan(PARITY_EPS);
    },
  );
});