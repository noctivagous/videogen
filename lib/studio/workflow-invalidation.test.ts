import { describe, expect, it } from 'vitest';
import { getBackdropSlotIndex } from '@/lib/studio/backdrop-framing';
import { isCharacterAssignmentComplete } from '@/lib/studio/mannequin-character-assignment';
import {
  resolveReferenceSlotInvalidation,
  resolveWorkflowInvalidation,
  splitInvalidationPatch,
} from '@/lib/studio/workflow-invalidation';
import { getWorkflowReferenceSteps } from '@/lib/studio/workflow';
import { createDefaultMannequin } from '@/lib/studio/mannequin-factory';
import type { Shot } from '@/lib/types/studio';

function baseShot(overrides: Partial<Shot> = {}): Shot {
  const mannequin = createDefaultMannequin();
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
    mannequins: [{ ...mannequin, subjectSlotIndex: 0 }],
    references: ['data:image/png;base64,sheet', 'data:image/png;base64,backdrop'],
    referenceRoles: ['Subject', 'Backdrop'],
    workflow: 'bake-start-frame',
    bakedStartFrame: 'data:image/png;base64,baked',
    bakedIntermediateFrame: 'data:image/png;base64,intermediate',
    bakeStatus: 'ready',
    backdropFramingByAspect: {
      '16:9': { scale: 1.2, x: 0, y: 0, locked: true },
    },
    backdropCropsByAspect: { '16:9': 'data:image/png;base64,crop' },
    backdropCropStatusByAspect: { '16:9': 'ready' },
    sceneSetup: 'Scene',
    shotActivity: 'Action',
    lighting: {
      colorPalette: {},
      videoLighting: { techniqueIds: ['afternoon-sun'] },
      videoEnvironment: { presetId: 'clear-day' },
    },
    motion: { subjectAction: 'shifts-weight', intensity: 'subtle' },
    ...overrides,
  } as Shot;
}

describe('resolveWorkflowInvalidation', () => {
  it('clears bake fields when Subject reference is cleared', () => {
    const shot = baseShot();
    const { shotPatch } = splitInvalidationPatch(
      resolveReferenceSlotInvalidation(shot, 0, { clearing: true, hadImage: true }),
    );

    expect(shotPatch).toMatchObject({
      bakeStatus: 'idle',
      bakedStartFrame: null,
      bakedIntermediateFrame: null,
      previewFrameFingerprint: null,
    });
    expect(shotPatch.backdropFramingByAspect).toBeUndefined();
  });

  it('clears backdrop crops and framing when Backdrop reference is cleared', () => {
    const shot = baseShot();
    const backdropIdx = getBackdropSlotIndex(shot);
    const { shotPatch } = splitInvalidationPatch(
      resolveReferenceSlotInvalidation(shot, backdropIdx, { clearing: true, hadImage: true }),
    );

    expect(shotPatch).toMatchObject({
      bakeStatus: 'idle',
      bakedStartFrame: null,
      backdropFramingByAspect: {},
    });
    expect(shotPatch.backdropCropsByAspect?.['16:9']).toBeUndefined();
    expect(shotPatch.backdropCropStatusByAspect?.['16:9']).toBeUndefined();
  });

  it('invalidates ready bake on mannequin layout change only when baked', () => {
    const ready = baseShot();
    const { shotPatch: readyPatch } = splitInvalidationPatch(
      resolveWorkflowInvalidation(ready, { kind: 'mannequin_layout_changed' }),
    );
    expect(readyPatch.bakedStartFrame).toBeNull();

    const idle = baseShot({ bakeStatus: 'idle', bakedStartFrame: null });
    const { shotPatch: idlePatch } = splitInvalidationPatch(
      resolveWorkflowInvalidation(idle, { kind: 'mannequin_layout_changed' }),
    );
    expect(Object.keys(idlePatch)).toHaveLength(0);
  });

  it('returns toast for manual bake invalidation', () => {
    const shot = baseShot();
    const { toast } = splitInvalidationPatch(
      resolveWorkflowInvalidation(shot, { kind: 'manual_invalidate_bake' }),
    );
    expect(toast).toBe('Baked frame invalidated');
  });
});

describe('checklist after reference removal', () => {
  it('marks assign-characters incomplete when Subject is cleared mid-checklist', () => {
    const shot = baseShot({
      references: [null, 'data:image/png;base64,backdrop'],
      mannequins: [createDefaultMannequin()],
    });

    expect(isCharacterAssignmentComplete(shot)).toBe(false);

    const steps = getWorkflowReferenceSteps(shot);
    const assignStep = steps.find((s) => s.id === 'assign-characters');
    expect(assignStep?.done).toBe(false);
  });

  it('marks backdrop step incomplete and clears bake when backdrop is cleared', () => {
    const shot = baseShot();
    const backdropIdx = getBackdropSlotIndex(shot);
    const clearedShot: Shot = {
      ...shot,
      references: [...shot.references],
      ...splitInvalidationPatch(
        resolveReferenceSlotInvalidation(shot, backdropIdx, { clearing: true, hadImage: true }),
      ).shotPatch,
    };
    clearedShot.references[backdropIdx] = null;

    const steps = getWorkflowReferenceSteps(clearedShot);
    expect(steps.find((s) => s.id === 'backdrop')?.done).toBe(false);
    expect(steps.find((s) => s.id === 'bake')?.done).toBe(false);
    expect(clearedShot.backdropFramingByAspect).toEqual({});
  });
});
