import { describe, expect, it } from 'vitest';
import {
  getManualCharacterSheetUrl,
  getSubjectCharacterSource,
  isManualCharacterSlot,
  isManagerCharacterSlot,
  MANUAL_CHARACTER_SHEET_LABEL,
} from '@/lib/studio/character-sheet-source';
import type { Setup, Shot } from '@/lib/types/studio';

function makeShot(refs: (string | null)[]): Shot {
  return {
    id: 'shot-1',
    references: refs,
    referenceRoles: refs.map((_, i) => (i === 0 ? 'Backdrop' : 'Subject')),
    lighting: {},
  } as unknown as Shot;
}

describe('character-sheet-source', () => {
  it('detects manager assignment', () => {
    const setup = { characterSlots: ['char-1'] } as Setup;
    expect(isManagerCharacterSlot(setup, makeShot([null, 'data:manual']), 0, 1)).toBe(true);
    expect(isManualCharacterSlot(setup, makeShot([null, 'data:manual']), 0, 1)).toBe(false);
  });

  it('detects manual sheet when unassigned with reference image', () => {
    const setup = { characterSlots: [null] } as Setup;
    const shot = makeShot([null, 'data:manual-sheet']);
    expect(isManualCharacterSlot(setup, shot, 0, 1)).toBe(true);
    expect(getSubjectCharacterSource(setup, shot, 0, 1)).toBe('manual');
    expect(getManualCharacterSheetUrl(shot, 1)).toBe('data:manual-sheet');
  });

  it('honors explicit manual mode when both sources exist', () => {
    const setup = {
      characterSlots: ['char-1'],
      subjectSlotSourceModes: ['manual'],
    } as Setup;
    const shot = makeShot([null, 'data:manual-sheet']);
    expect(getSubjectCharacterSource(setup, shot, 0, 1)).toBe('manual');
  });

  it('exports manual label constant', () => {
    expect(MANUAL_CHARACTER_SHEET_LABEL).toBe('Manual Character Sheet');
  });
});
