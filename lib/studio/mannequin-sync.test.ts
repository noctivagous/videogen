import { describe, expect, it } from 'vitest';
import { createDefaultMannequin } from '@/lib/studio/mannequin-factory';
import { syncMannequinsFromShot } from '@/lib/studio/mannequin-sync';
import type { Shot } from '@/lib/types/studio';

function baseShot(overrides: Partial<Shot> = {}): Shot {
  return {
    id: 1,
    name: 'Test',
    active: true,
    camera: {
      fieldSize: 'ms',
      subjectCount: '2s',
      coverage: 'clean',
      lensType: 'standard',
      focalLength: 35,
      angle: 'eye-level',
      movement: 'static',
      aperture: 2.8,
      dof: 'medium',
    },
    frameComposition: {
      guide: 'grid-3x3',
      placement: 'cell-1-1',
      headroom: 'normal',
      showOverlay: true,
    },
    mannequins: [],
    references: [],
    referenceRoles: ['Subject', 'Subject'],
    ...overrides,
  } as Shot;
}

describe('syncMannequinsFromShot', () => {
  it('does not re-add mannequins removed below subject-count limit on field-size change', () => {
    const prevShot = baseShot({
      mannequins: [
        createDefaultMannequin({ id: 'a', x: 0.4, y: 0.92, scale: 1.1 }),
        createDefaultMannequin({ id: 'b', x: 0.6, y: 0.92, scale: 1.1 }),
      ],
    });
    const afterDelete: Shot = {
      ...prevShot,
      mannequins: [prevShot.mannequins![0]!],
    };
    const nextShot: Shot = {
      ...afterDelete,
      camera: { ...afterDelete.camera, fieldSize: 'cu' },
    };

    const synced = syncMannequinsFromShot(nextShot, afterDelete.mannequins, {
      reason: 'camera',
      prevShot: afterDelete,
      aspectRatio: '16:9',
    });

    expect(synced).toHaveLength(1);
    expect(synced[0]?.id).toBe('a');
    expect(synced[0]?.scale).not.toBeCloseTo(1.1, 1);
  });

  it('seeds missing mannequins when subject count increases', () => {
    const prevShot = baseShot({
      camera: {
        ...baseShot().camera,
        subjectCount: '1s',
      },
      mannequins: [createDefaultMannequin({ id: 'solo', x: 0.5, y: 0.92 })],
    });
    const nextShot: Shot = {
      ...prevShot,
      camera: { ...prevShot.camera, subjectCount: '2s' },
    };

    const synced = syncMannequinsFromShot(nextShot, prevShot.mannequins, {
      reason: 'camera',
      prevShot,
      aspectRatio: '16:9',
    });

    expect(synced).toHaveLength(2);
    expect(synced.some((m) => m.id === 'solo')).toBe(true);
  });
});