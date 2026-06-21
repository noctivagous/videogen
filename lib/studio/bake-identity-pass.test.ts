import { describe, expect, it } from 'vitest';
import { buildIdentityPassPlan } from '@/lib/studio/bake-identity-pass';
import { createDefaultMannequin } from '@/lib/studio/mannequin-factory';
import type { Shot } from '@/lib/types/studio';

function baseShot(overrides: Partial<Shot> = {}): Shot {
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
    mannequins: [],
    references: ['data:image/png;base64,sheet'],
    referenceRoles: ['Subject'],
    workflow: 'bake-start-frame',
    ...overrides,
  } as Shot;
}

describe('buildIdentityPassPlan', () => {
  it('uses scene-locked identity prompt for a single assigned mannequin', () => {
    const mannequin = {
      ...createDefaultMannequin(),
      angle: 'left' as const,
      subjectSlotIndex: 0,
    };
    const shot = baseShot({ mannequins: [mannequin] });
    const plan = buildIdentityPassPlan(shot, 'data:image/png;base64,scene');

    expect(plan?.passes).toHaveLength(1);
    const pass = plan!.passes[0]!;
    const prompt = pass.prompt;
    expect(prompt).toContain('<IMAGE_0>');
    expect(prompt).toContain('<IMAGE_1>');
    expect(prompt).toContain('Left Profile');
    expect(prompt).toContain('locked composition');
    expect(prompt).toContain('Edit <IMAGE_0> in place');
    expect(prompt).not.toContain('Place the subject');
    expect(prompt).not.toContain('environment from');
    expect(pass.refs[0]?.role).toBe('Backdrop');
    expect(pass.refs[1]?.role).toBe('Subject');
  });
});