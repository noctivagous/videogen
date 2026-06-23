import { createCoverageShot, createSetup } from '@/lib/studio/coverage-shot-settings';
import {
  patchCurrentResolvedShot,
  resolveShot,
} from '@/lib/studio/resolved-shot';
import { describe, expect, it } from 'vitest';

const SUBJECT_REF = 'data:image/png;base64,subject';
const STYLE_REF = 'data:image/png;base64,style';
const BACKDROP_REF = 'data:image/png;base64,backdrop';

function createPrependedBackdropSetup() {
  const coverage = createCoverageShot(1, 'Wide', true, 'plate-1');
  return createSetup(1, 'Setup 01', 1, true, coverage, {
    backdropUrl: BACKDROP_REF,
    setupSettings: {
      references: [SUBJECT_REF, null],
      referenceRoles: ['Subject', 'Style'],
    },
  });
}

function createInlineBackdropSetup() {
  const coverage = createCoverageShot(1, 'Wide', true, 'plate-1');
  return createSetup(1, 'Setup 01', 1, true, coverage, {
    backdropUrl: BACKDROP_REF,
    setupSettings: {
      references: [null, SUBJECT_REF, null],
      referenceRoles: ['Backdrop', 'Subject', 'Style'],
    },
  });
}

describe('patchCurrentResolvedShot references', () => {
  it('persists style-slot drops when backdrop is prepended in resolved view', () => {
    const setups = [createPrependedBackdropSetup()];
    const setup = setups[0];
    const coverage = setup.shots[0];
    const resolved = resolveShot(setup, coverage)!;

    expect(resolved.references[2]).toBeNull();

    const patchedRefs = [...resolved.references];
    patchedRefs[2] = STYLE_REF;

    const nextSetups = patchCurrentResolvedShot(setups, setup.id, coverage.id, {
      references: patchedRefs,
    });
    const nextSetup = nextSetups[0];
    expect(nextSetup.references).toEqual([SUBJECT_REF, STYLE_REF]);

    const reread = resolveShot(nextSetup, coverage)!;
    expect(reread.references[2]).toBe(STYLE_REF);
  });

  it('persists subject-slot drops when backdrop role is stored on setup', () => {
    const setups = [createInlineBackdropSetup()];
    const setup = setups[0];
    const coverage = setup.shots[0];
    const resolved = resolveShot(setup, coverage)!;

    const patchedRefs = [...resolved.references];
    patchedRefs[2] = STYLE_REF;

    const nextSetups = patchCurrentResolvedShot(setups, setup.id, coverage.id, {
      references: patchedRefs,
    });
    const nextSetup = nextSetups[0];
    expect(nextSetup.references[0]).toBeNull();
    expect(nextSetup.references[2]).toBe(STYLE_REF);

    const reread = resolveShot(nextSetup, coverage)!;
    expect(reread.references[2]).toBe(STYLE_REF);
  });
});
