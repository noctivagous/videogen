import { describe, expect, it } from 'vitest';
import type { MannequinVariant } from '@/lib/constants/mannequin-assets';
import { ALL_FIELD_SIZES } from '@/lib/constants/subject-cutouts';
import {
  FIELD_SIZE_BOUNDS_PRESETS,
  MANNEQUIN_DEMOGRAPHICS,
} from '@/lib/constants/mannequin-bounds-presets';
import { mannequinTrim, mannequinVariantFrom } from '@/lib/constants/mannequin-assets';
import {
  anchorToBoundsFrame,
  boundsFrameToAnchor,
  defaultBoundsForFieldSize,
  fieldSizeAnchor,
  maxWidthToFrameHeight,
  patchBoundsFrame,
  scaleFromWidthToFrameHeight,
  type MannequinBoundsFrame,
} from '@/lib/studio/mannequin-bounds-framing';
import { MANNEQUIN_SCALE_MAX } from '@/lib/studio/mannequin-layout';
import { mannequinFieldSizeAnchor } from '@/lib/studio/mannequin-sync';
import type { AspectRatio, FieldSize, MannequinAge, MannequinGender } from '@/lib/types/studio';

const EPS = 1e-6;

function variant(
  gender: MannequinGender = 'male',
  age: MannequinAge = 'adult',
): MannequinVariant {
  return { gender, age, pose: 'standard', angle: 'front' };
}

function expectBoundsClose(actual: MannequinBoundsFrame, expected: MannequinBoundsFrame) {
  expect(actual.insetLeft).toBeCloseTo(expected.insetLeft, 6);
  expect(actual.insetRight).toBeCloseTo(expected.insetRight, 6);
  expect(actual.insetTop).toBeCloseTo(expected.insetTop, 6);
  expect(actual.insetBottom).toBeCloseTo(expected.insetBottom, 6);
  expect(actual.widthToFrameHeight).toBeCloseTo(expected.widthToFrameHeight, 6);
}

function roundTripBounds(
  bounds: MannequinBoundsFrame,
  mannequinVariant: MannequinVariant,
  aspectRatio: AspectRatio = '16:9',
  anchorX = 0.5,
): MannequinBoundsFrame {
  const anchor = boundsFrameToAnchor(bounds, mannequinVariant, aspectRatio, anchorX);
  return anchorToBoundsFrame(
    {
      ...anchor,
      gender: mannequinVariant.gender,
      age: mannequinVariant.age,
      pose: mannequinVariant.pose,
      angle: mannequinVariant.angle,
    },
    aspectRatio,
    anchorX,
  );
}

describe('mannequin bounds framing round-trip', () => {
  it.each([
    ['ecu', -0.3, 0, 3],
    ['cu', 0.2, 0.025, 1.7],
    ['mcu', 0.290625, 0.058333, 0.987],
  ] as const)(
    '%s preset matches expected bounds for male adult',
    (fieldSize, insetLeft, insetTop, widthToFrameHeight) => {
      const bounds = defaultBoundsForFieldSize(fieldSize, 'normal', 0.5, '16:9', variant());
      expect(bounds.insetLeft).toBeCloseTo(insetLeft, 4);
      expect(bounds.insetTop).toBeCloseTo(insetTop, 4);
      expect(bounds.widthToFrameHeight).toBeCloseTo(widthToFrameHeight, 4);
    },
  );

  it.each(MANNEQUIN_DEMOGRAPHICS)(
    'CU preset round-trips for %s at 16:9',
    (demographic) => {
      const [gender, age] = demographic.split('-') as [MannequinGender, MannequinAge];
      const mannequinVariant = variant(gender, age);
      const bounds = defaultBoundsForFieldSize('cu', 'normal', 0.5, '16:9', mannequinVariant);
      expectBoundsClose(roundTripBounds(bounds, mannequinVariant), bounds);
    },
  );

  it.each(ALL_FIELD_SIZES)(
    'preset round-trips for %s male adult at 16:9',
    (fieldSize) => {
      const mannequinVariant = variant();
      const bounds = defaultBoundsForFieldSize(fieldSize, 'normal', 0.5, '16:9', mannequinVariant);
      expectBoundsClose(roundTripBounds(bounds, mannequinVariant), bounds);
    },
  );

  it('CU preset round-trips at 9:16', () => {
    const mannequinVariant = variant();
    const bounds = defaultBoundsForFieldSize('cu', 'normal', 0.5, '9:16', mannequinVariant);
    expectBoundsClose(roundTripBounds(bounds, mannequinVariant, '9:16'), bounds);
  });

  it('fieldSizeAnchor agrees with boundsFrameToAnchor for CU', () => {
    const mannequinVariant = variant();
    const bounds = defaultBoundsForFieldSize('cu', 'normal', 0.5, '16:9', mannequinVariant);
    const fromBounds = boundsFrameToAnchor(bounds, mannequinVariant, '16:9');
    const fromFieldSize = fieldSizeAnchor('cu', 'normal', 0.5, '16:9', mannequinVariant);
    expect(fromFieldSize.x).toBeCloseTo(fromBounds.x, 6);
    expect(fromFieldSize.y).toBeCloseTo(fromBounds.y, 6);
    expect(fromFieldSize.scale).toBeCloseTo(fromBounds.scale, 6);
  });

  it('mannequinFieldSizeAnchor round-trips through anchorToBoundsFrame for CU at center', () => {
    const shot = {
      camera: { fieldSize: 'cu' as const },
      frameComposition: { placement: 'cell-1-1', headroom: 'normal' as const },
    } as Parameters<typeof mannequinFieldSizeAnchor>[0];
    const mannequinVariant = variant();
    const anchor = mannequinFieldSizeAnchor(shot, mannequinVariant, '16:9');
    const bounds = anchorToBoundsFrame({ ...anchor, ...mannequinVariant }, '16:9', 0.5);
    expect(bounds.insetLeft).toBeCloseTo(0.2, EPS);
    expect(bounds.insetTop).toBeCloseTo(0.025, EPS);
    expect(bounds.widthToFrameHeight).toBeCloseTo(1.7, EPS);
  });

  it('CU at bottom-left cell shows preset left inset, not placement-shifted value', () => {
    const shot = {
      camera: { fieldSize: 'cu' as const },
      frameComposition: { placement: 'cell-2-0', headroom: 'normal' as const },
    } as Parameters<typeof mannequinFieldSizeAnchor>[0];
    const mannequinVariant = variant();
    const anchor = mannequinFieldSizeAnchor(shot, mannequinVariant, '16:9');
    const bounds = anchorToBoundsFrame(
      { ...anchor, ...mannequinVariant },
      '16:9',
      1 / 6,
    );
    expect(bounds.insetLeft).toBeCloseTo(0.2, EPS);
    expect(bounds.insetTop).toBeCloseTo(0.025, EPS);
    expect(bounds.widthToFrameHeight).toBeCloseTo(1.7, EPS);
  });

  it('insetTop matches trim-aware hit-target top for CU', () => {
    const shot = {
      camera: { fieldSize: 'cu' as const },
      frameComposition: { placement: 'cell-2-0', headroom: 'normal' as const },
    } as Parameters<typeof mannequinFieldSizeAnchor>[0];
    const mannequinVariant = variant();
    const anchor = mannequinFieldSizeAnchor(shot, mannequinVariant, '16:9');
    const mannequin = { ...anchor, ...mannequinVariant };
    const trim = mannequinTrim(mannequinVariantFrom(mannequin));
    const visualHeight = 0.55 * anchor.scale;
    const pngHeight = visualHeight / trim.contentHeightRatio;
    const hitTargetTop = anchor.y - pngHeight * (1 - trim.paddingTop);
    const bounds = anchorToBoundsFrame(mannequin, '16:9', 1 / 6);
    expect(bounds.insetTop).toBeCloseTo(hitTargetTop, EPS);
  });

  it('patchBoundsFrame left edit translates without changing scale', () => {
    const mannequinVariant = variant();
    const trim = mannequinTrim(mannequinVariant);
    const initial = defaultBoundsForFieldSize('cu', 'normal', 0.5, '16:9', mannequinVariant);
    const anchor = boundsFrameToAnchor(initial, mannequinVariant, '16:9', 0.5);
    const patched = patchBoundsFrame(initial, { insetLeft: initial.insetLeft + 0.05 }, '16:9', trim);
    const nextAnchor = boundsFrameToAnchor(patched, mannequinVariant, '16:9', 0.5);
    expect(patched.widthToFrameHeight).toBeCloseTo(initial.widthToFrameHeight, EPS);
    expect(nextAnchor.scale).toBeCloseTo(anchor.scale, EPS);
    expect(nextAnchor.x).toBeGreaterThan(anchor.x);
    expect(nextAnchor.y).toBeCloseTo(anchor.y, EPS);
  });

  it('patchBoundsFrame right edit translates without changing scale', () => {
    const mannequinVariant = variant();
    const trim = mannequinTrim(mannequinVariant);
    const initial = defaultBoundsForFieldSize('cu', 'normal', 0.5, '16:9', mannequinVariant);
    const anchor = boundsFrameToAnchor(initial, mannequinVariant, '16:9', 0.5);
    const patched = patchBoundsFrame(initial, { insetRight: initial.insetRight + 0.05 }, '16:9', trim);
    const nextAnchor = boundsFrameToAnchor(patched, mannequinVariant, '16:9', 0.5);
    expect(patched.widthToFrameHeight).toBeCloseTo(initial.widthToFrameHeight, EPS);
    expect(nextAnchor.scale).toBeCloseTo(anchor.scale, EPS);
    expect(nextAnchor.x).toBeLessThan(anchor.x);
    expect(nextAnchor.y).toBeCloseTo(anchor.y, EPS);
  });

  it('patchBoundsFrame W÷H edit round-trips', () => {
    const mannequinVariant = variant();
    const initial = defaultBoundsForFieldSize('ms', 'normal', 0.5, '16:9', mannequinVariant);
    const patched = patchBoundsFrame(
      initial,
      { widthToFrameHeight: 1.418 },
      '16:9',
      // trim resolved inside patch via sync — pass through boundsFrameToAnchor path
    );
    const anchor = boundsFrameToAnchor(patched, mannequinVariant, '16:9', 0.5);
    const roundTrip = anchorToBoundsFrame({ ...anchor, ...mannequinVariant }, '16:9', 0.5);
    expect(roundTrip.widthToFrameHeight).toBeCloseTo(1.418, 6);
    expect(roundTrip.insetLeft).toBeCloseTo(patched.insetLeft, 6);
    expect(roundTrip.insetTop).toBeCloseTo(patched.insetTop, 6);
  });
});

describe('mannequin scale limits', () => {
  it('ECU tuned W÷H=3 fits within MANNEQUIN_SCALE_MAX', () => {
    const trim = mannequinTrim(variant());
    const bounds = defaultBoundsForFieldSize('ecu', 'normal', 0.5, '16:9', variant());
    const scale = scaleFromWidthToFrameHeight(bounds.widthToFrameHeight, trim);
    expect(scale).toBeLessThanOrEqual(MANNEQUIN_SCALE_MAX);
    expect(bounds.widthToFrameHeight).toBeLessThanOrEqual(maxWidthToFrameHeight(trim));
  });

  it('W÷H=3 is achievable at MANNEQUIN_SCALE_MAX for male adult front', () => {
    const trim = mannequinTrim(variant());
    expect(maxWidthToFrameHeight(trim)).toBeGreaterThanOrEqual(3);
    expect(scaleFromWidthToFrameHeight(3, trim)).toBeLessThanOrEqual(MANNEQUIN_SCALE_MAX);
  });
});

describe('mannequin bounds presets coverage', () => {
  it.each(ALL_FIELD_SIZES)('field size %s has every demographic preset', (fieldSize) => {
    const table = FIELD_SIZE_BOUNDS_PRESETS[fieldSize];
    expect(table).toBeDefined();
    for (const key of MANNEQUIN_DEMOGRAPHICS) {
      expect(table[key]).toMatchObject({
        insetLeft: expect.any(Number),
        insetTop: expect.any(Number),
        widthToFrameHeight: expect.any(Number),
      });
    }
  });

  it.each([
    ['ecu', { insetLeft: -0.3, insetTop: 0, widthToFrameHeight: 3 }],
    ['cu', { insetLeft: 0.2, insetTop: 0.025, widthToFrameHeight: 1.7 }],
    ['mcu', { insetLeft: 0.290625, insetTop: 0.058333, widthToFrameHeight: 0.987 }],
  ] as const)('%s table uses expected male values for all male demographics', (fieldSize, malePreset) => {
    for (const key of MANNEQUIN_DEMOGRAPHICS.filter((d) => d.startsWith('male-'))) {
      expect(FIELD_SIZE_BOUNDS_PRESETS[fieldSize][key]).toMatchObject(malePreset);
    }
  });
});