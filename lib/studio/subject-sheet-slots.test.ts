import { describe, expect, it } from 'vitest';
import { STOCK_REFERENCE_ROLES } from '@/lib/constants/stock-project';
import { STOCK_CAMERA } from '@/lib/constants/stock-project';
import {
  areSubjectSheetsComplete,
  ensureSubjectChecklistSlots,
  getSubjectChecklistSlotIndices,
  getSubjectSheetSlotCount,
} from '@/lib/studio/subject-sheet-slots';
import { getWorkflowReferenceSteps } from '@/lib/studio/workflow';
import type { Shot, SubjectCount } from '@/lib/types/studio';

function baseShot(overrides: Partial<Shot> = {}): Shot {
  return {
    id: 1,
    name: 'Test',
    active: true,
    camera: { ...STOCK_CAMERA, ...(overrides.camera ?? {}) },
    frameComposition: {
      guide: 'grid-3x3',
      placement: 'cell-1-1',
      headroom: 'normal',
      showOverlay: true,
    },
    mannequins: [],
    references: [null, null, null],
    referenceRoles: [...STOCK_REFERENCE_ROLES],
    workflow: 'bake-start-frame',
    sceneSetup: 'Scene',
    shotActivity: 'Action',
    lighting: {
      colorPalette: {},
      videoLighting: { techniqueIds: [], modifiers: {} },
      videoEnvironment: { presetId: null },
    },
    motion: { subjectAction: 'shifts-weight', intensity: 'subtle' },
    ...overrides,
  } as Shot;
}

function shotWithSubjectCount(subjectCount: SubjectCount, extra: Partial<Shot['camera']> = {}): Shot {
  return baseShot({ camera: { ...STOCK_CAMERA, subjectCount, ...extra } });
}

describe('getSubjectSheetSlotCount', () => {
  it('returns expected slot counts per subject count', () => {
    expect(getSubjectSheetSlotCount(shotWithSubjectCount('1s'))).toBe(1);
    expect(getSubjectSheetSlotCount(shotWithSubjectCount('2s'))).toBe(2);
    expect(getSubjectSheetSlotCount(shotWithSubjectCount('3s'))).toBe(3);
    expect(getSubjectSheetSlotCount(shotWithSubjectCount('group'))).toBe(4);
    expect(getSubjectSheetSlotCount(shotWithSubjectCount('crowd'))).toBe(0);
    expect(
      getSubjectSheetSlotCount(shotWithSubjectCount('crowd', { heroSubjectsEnabled: true })),
    ).toBe(2);
  });
});

describe('ensureSubjectChecklistSlots', () => {
  it('keeps backdrop at index 0 and adds a second Subject for 2S', () => {
    const shot = shotWithSubjectCount('2s');
    const patch = ensureSubjectChecklistSlots(shot);
    expect(patch).not.toBeNull();

    const next = { ...shot, ...patch };
    expect(next.referenceRoles[0]).toBe('Backdrop');
    expect(next.referenceRoles[1]).toBe('Subject');
    expect(next.referenceRoles[2]).toBe('Subject');
    expect(getSubjectChecklistSlotIndices(next)).toEqual([1, 2]);
  });

  it('provisions three Subject slots for 3S', () => {
    const shot = shotWithSubjectCount('3s');
    const next = { ...shot, ...ensureSubjectChecklistSlots(shot)! };
    expect(getSubjectChecklistSlotIndices(next)).toEqual([1, 2, 3]);
    expect(next.referenceRoles[0]).toBe('Backdrop');
  });

  it('provisions four Subject slots for group', () => {
    const shot = shotWithSubjectCount('group');
    const next = { ...shot, ...ensureSubjectChecklistSlots(shot)! };
    expect(getSubjectChecklistSlotIndices(next)).toEqual([1, 2, 3, 4]);
  });

  it('demotes subject slots for crowd without heroes', () => {
    const shot = baseShot({
      camera: { ...STOCK_CAMERA, subjectCount: 'crowd', heroSubjectsEnabled: false },
      referenceRoles: ['Backdrop', 'Subject', 'Style'],
    });
    const patch = ensureSubjectChecklistSlots(shot);
    expect(patch?.referenceRoles?.[1]).toBe('Style');
    expect(areSubjectSheetsComplete(shot)).toBe(true);
  });
});

describe('areSubjectSheetsComplete', () => {
  it('requires all checklist subject slots to be filled', () => {
    const shot = baseShot({
      camera: { ...STOCK_CAMERA, subjectCount: '2s' },
      references: ['data:image/png;base64,backdrop', 'data:image/png;base64,a', null],
      referenceRoles: ['Backdrop', 'Subject', 'Subject'],
    });

    expect(areSubjectSheetsComplete(shot)).toBe(false);

    const complete = {
      ...shot,
      references: [
        'data:image/png;base64,backdrop',
        'data:image/png;base64,a',
        'data:image/png;base64,b',
      ],
    };
    expect(areSubjectSheetsComplete(complete)).toBe(true);
  });

  it('requires at least one hero sheet when crowd heroes enabled', () => {
    const shot = baseShot({
      camera: { ...STOCK_CAMERA, subjectCount: 'crowd', heroSubjectsEnabled: true },
      references: ['data:image/png;base64,backdrop', null, null],
      referenceRoles: ['Backdrop', 'Subject', 'Subject'],
    });
    expect(areSubjectSheetsComplete(shot)).toBe(false);
    expect(
      areSubjectSheetsComplete({
        ...shot,
        references: ['data:image/png;base64,backdrop', 'data:image/png;base64,hero', null],
      }),
    ).toBe(true);
  });
});

describe('workflow character-sheet step', () => {
  it('marks character-sheet incomplete when only one of two sheets is filled', () => {
    const shot = baseShot({
      camera: { ...STOCK_CAMERA, subjectCount: '2s' },
      references: ['data:image/png;base64,backdrop', 'data:image/png;base64,a', null],
      referenceRoles: ['Backdrop', 'Subject', 'Subject'],
    });

    const steps = getWorkflowReferenceSteps(shot);
    const sheetStep = steps.find((step) => step.id === 'character-sheet');
    expect(sheetStep?.label).toBe('Character Sheets (2)');
    expect(sheetStep?.done).toBe(false);
  });
});
