import { describe, expect, it } from 'vitest';
import { STOCK_CAMERA } from '@/lib/constants/stock-project';
import { layoutTwoShotFromArrangement } from '@/lib/studio/mannequin-layouts';
import type { TwoShotArrangement } from '@/lib/types/studio';

const anchor = { anchorX: 0.5, feetY: 0.85, scale: 1 };

const TWO_SHOT_ARRANGEMENTS: TwoShotArrangement[] = [
  'two-shot-clean',
  'two-shot-dirty',
  'ots-left',
  'ots-right',
  'profile',
  'staggered',
];

describe('layoutTwoShotFromArrangement', () => {
  it.each(TWO_SHOT_ARRANGEMENTS)('returns two mannequins for %s', (arrangement) => {
    const mannequins = layoutTwoShotFromArrangement(arrangement, anchor);
    expect(mannequins).toHaveLength(2);
  });

  it('places OTS left foreground on the left side', () => {
    const [foreground] = layoutTwoShotFromArrangement('ots-left', anchor);
    expect(foreground.x).toBeLessThan(0.5);
  });

  it('places OTS right foreground on the right side', () => {
    const [foreground] = layoutTwoShotFromArrangement('ots-right', anchor);
    expect(foreground.x).toBeGreaterThan(0.5);
  });

  it('offsets profile subjects horizontally', () => {
    const [left, right] = layoutTwoShotFromArrangement('profile', anchor);
    expect(left.x).toBeLessThan(right.x);
  });

  it('uses lower opacity for dirty foreground shoulder', () => {
    const [, shoulder] = layoutTwoShotFromArrangement('two-shot-dirty', anchor);
    expect(shoulder.opacity).toBeLessThan(1);
  });
});

describe('layoutFromCamera routing', () => {
  it('routes 2S through arrangement not coverage', async () => {
    const { buildDefaultMannequins } = await import('@/lib/studio/mannequin-sync');
    const shot = {
      camera: {
        ...STOCK_CAMERA,
        subjectCount: '2s' as const,
        coverage: 'clean',
        arrangement: 'ots-left' as const,
      },
      frameComposition: {
        guide: 'grid-3x3' as const,
        placement: 'cell-1-1',
        headroom: 'normal' as const,
        showOverlay: true,
      },
    };
    const mannequins = buildDefaultMannequins(shot as never);
    expect(mannequins[0]?.x).toBeLessThan(0.5);
  });
});
