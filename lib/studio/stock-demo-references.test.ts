import { describe, expect, it } from 'vitest';
import {
  STOCK_CHARACTER_REF,
  STOCK_SETUPS,
} from '@/lib/constants/stock-project';
import { resolveShot } from '@/lib/studio/resolved-shot';
import {
  ensureSubjectChecklistSlots,
  getSubjectChecklistSlotIndices,
} from '@/lib/studio/subject-sheet-slots';
import { applyProjectHierarchy } from '@/lib/studio/store-hierarchy';
import { STOCK_LIGHTING, STOCK_PROJECT } from '@/lib/constants/stock-project';
import { migrateSetup } from '@/lib/studio/coverage-shot-settings';

describe('stock demo surfer references', () => {
  it('loads character sheet in the subject checklist slot for default stock setup', () => {
    const setup = STOCK_SETUPS[0];
    const resolved = resolveShot(setup, setup.shots[0])!;
    const subjectSlots = getSubjectChecklistSlotIndices(resolved);

    expect(subjectSlots).toEqual([1]);
    expect(resolved.references[1]).toBe(STOCK_CHARACTER_REF);
  });

  it('keeps character sheet in subject slot after ensureSubjectChecklistSlots', () => {
    const setup = STOCK_SETUPS[0];
    let resolved = resolveShot(setup, setup.shots[0])!;
    const patch = ensureSubjectChecklistSlots(resolved);
    if (patch) resolved = { ...resolved, ...patch };

    const subjectSlots = getSubjectChecklistSlotIndices(resolved);
    expect(resolved.references[subjectSlots[0]]).toBe(STOCK_CHARACTER_REF);
  });

  it('loads character sheet when applying stock project hierarchy', () => {
    const hierarchy = applyProjectHierarchy(
      {
        schemaVersion: 18,
        project: STOCK_PROJECT,
        scenes: [{ id: 1, name: 'Scene 1' }],
        currentSceneId: 1,
        setups: STOCK_SETUPS,
        currentSetupId: 1,
        currentCoverageShotId: 1,
      },
      { lighting: STOCK_LIGHTING, sceneSetup: '' },
    );
    const setup = hierarchy.setups[0];
    const resolved = resolveShot(setup, setup.shots[0])!;
    const subjectSlots = getSubjectChecklistSlotIndices(resolved);

    expect(resolved.references[subjectSlots[0]]).toBe(STOCK_CHARACTER_REF);
  });

  it('heals stock subject into the checklist slot when roles are misordered', () => {
    const setup = STOCK_SETUPS[0];
    const migrated = migrateSetup(
      {
        ...setup,
        references: [STOCK_CHARACTER_REF, null],
        referenceRoles: ['Style', 'Subject'],
      },
      { lighting: STOCK_LIGHTING, sceneSetup: '' },
    );

    const resolved = resolveShot(migrated, migrated.shots[0])!;
    const subjectSlots = getSubjectChecklistSlotIndices(resolved);
    expect(subjectSlots).toEqual([2]);
    expect(resolved.references[2]).toBe(STOCK_CHARACTER_REF);
  });
});
