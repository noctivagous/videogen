import { effectiveReferenceUrl } from '@/lib/studio/theme-transform';
import { resolveTypedOrManualSourceMode } from '@/lib/studio/slot-source-mode';
import type { Setup, Shot } from '@/lib/types/studio';

export const MANUAL_CHARACTER_SHEET_LABEL = 'Manual Character Sheet';

export function getManualCharacterSheetUrl(shot: Shot, refSlotIndex: number): string | null {
  if (refSlotIndex < 0) return null;
  return effectiveReferenceUrl(shot, refSlotIndex, shot.lighting) ?? shot.references[refSlotIndex] ?? null;
}

export function hasTypedCharacterSlotValue(
  setup: Pick<Setup, 'characterSlots'> | undefined,
  slotOrdinal: number,
): boolean {
  return Boolean(setup?.characterSlots?.[slotOrdinal]);
}

export function getExplicitSubjectSlotSourceMode(
  setup: Pick<Setup, 'subjectSlotSourceModes'> | undefined,
  slotOrdinal: number,
): 'typed' | 'manual' | null {
  return setup?.subjectSlotSourceModes?.[slotOrdinal] ?? null;
}

export function getSubjectCharacterSource(
  setup: Pick<Setup, 'characterSlots' | 'subjectSlotSourceModes'> | undefined,
  shot: Shot,
  slotOrdinal: number,
  refSlotIndex: number,
): 'manager' | 'manual' | 'none' {
  const resolved = resolveTypedOrManualSourceMode(
    getExplicitSubjectSlotSourceMode(setup, slotOrdinal),
    {
      hasTypedValue: hasTypedCharacterSlotValue(setup, slotOrdinal),
      hasManualValue: Boolean(getManualCharacterSheetUrl(shot, refSlotIndex)),
    },
  );
  if (resolved === 'typed') return 'manager';
  return resolved;
}

export function isManagerCharacterSlot(
  setup: Pick<Setup, 'characterSlots' | 'subjectSlotSourceModes'> | undefined,
  shot: Shot,
  slotOrdinal: number,
  refSlotIndex: number,
): boolean {
  return getSubjectCharacterSource(setup, shot, slotOrdinal, refSlotIndex) === 'manager';
}

export function isManualCharacterSlot(
  setup: Pick<Setup, 'characterSlots' | 'subjectSlotSourceModes'> | undefined,
  shot: Shot,
  slotOrdinal: number,
  refSlotIndex: number,
): boolean {
  return getSubjectCharacterSource(setup, shot, slotOrdinal, refSlotIndex) === 'manual';
}
