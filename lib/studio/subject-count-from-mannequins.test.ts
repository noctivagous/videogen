import { describe, expect, it } from 'vitest';
import {
  subjectCountForPrincipalCount,
  subjectCountFromMannequins,
} from '@/lib/studio/subject-count-from-mannequins';
import { createDefaultMannequin } from '@/lib/studio/mannequin-factory';
import { canAddMannequin } from '@/lib/studio/mannequin-factory';
import type { Shot } from '@/lib/types/studio';

function baseShot(mannequins: Shot['mannequins'] = []): Shot {
  return {
    id: 1,
    name: 'Test',
    active: true,
    camera: {
      fieldSize: 'ms',
      subjectCount: '1s',
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
    mannequins,
    references: [],
    referenceRoles: ['Subject'],
  } as Shot;
}

describe('subjectCountFromMannequins', () => {
  it('maps principal counts to subject count presets', () => {
    expect(subjectCountForPrincipalCount(0)).toBe('1s');
    expect(subjectCountForPrincipalCount(1)).toBe('1s');
    expect(subjectCountForPrincipalCount(2)).toBe('2s');
    expect(subjectCountForPrincipalCount(3)).toBe('3s');
    expect(subjectCountForPrincipalCount(4)).toBe('group');
    expect(subjectCountForPrincipalCount(5)).toBe('group');
    expect(subjectCountForPrincipalCount(6)).toBe('crowd');
  });

  it('ignores ghost mannequins when inferring subject count', () => {
    const mannequins = [
      createDefaultMannequin({ opacity: 1 }),
      createDefaultMannequin({ opacity: 0.3 }),
    ];
    expect(subjectCountFromMannequins(mannequins)).toBe('1s');
  });
});

describe('canAddMannequin', () => {
  it('allows adding a second mannequin while subject count is still 1s', () => {
    const shot = baseShot([createDefaultMannequin()]);
    expect(canAddMannequin(shot)).toBe(true);
  });
});
