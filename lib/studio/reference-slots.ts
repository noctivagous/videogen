import { isAutoRolesReferenceMode } from '@/lib/constants/reference-modes';
import type { ReferenceRole, Shot, ThemeTransformSlotStatus } from '@/lib/types/studio';
import { ensureSlotArrayLength } from '@/lib/studio/theme-transform';

export const MIN_REFERENCE_SLOTS = 3;

export interface ReferenceSlotArrays {
  references: (string | null)[];
  referenceRoles: ReferenceRole[];
  transformedReferences: (string | null)[];
  themeTransformFingerprint: (string | null)[];
  themeTransformStatus: ThemeTransformSlotStatus[];
  themeTransformError: (string | null)[];
  themeTransformLinked: boolean[];
}

/** Auto-roles mode: slots use Subject/Backdrop/Style and role-aware prompt assembly. */
export function isCinematographyRefs(shot: Shot | undefined): boolean {
  return isAutoRolesReferenceMode(shot);
}

export function formatReferenceRoleLabel(role: ReferenceRole): string {
  if (role === 'Style') return 'Other/Style';
  return role;
}

export function getReferenceSlotLabel(
  shot: Shot | undefined,
  slotIndex: number,
  role: ReferenceRole,
): string {
  if (!isCinematographyRefs(shot)) {
    return `Image${slotIndex + 1}`;
  }
  return formatReferenceRoleLabel(role);
}

export function getFirstSlotReferenceUrl(shot: Shot | undefined): string | null {
  if (!shot) return null;
  for (const ref of shot.references) {
    if (ref) return ref;
  }
  return null;
}

export function getReferenceSlotCount(shot: Shot | undefined): number {
  if (!shot) return MIN_REFERENCE_SLOTS;
  return Math.max(MIN_REFERENCE_SLOTS, shot.references.length);
}

export function getReferenceSlotIndices(shot: Shot | undefined): number[] {
  const count = getReferenceSlotCount(shot);
  return Array.from({ length: count }, (_, index) => index);
}

/** Keep per-slot parallel arrays aligned with `references` length (min 3). */
export function normalizeReferenceSlotArrays(shot: Shot): ReferenceSlotArrays {
  const count = getReferenceSlotCount(shot);
  return {
    references: ensureSlotArrayLength(shot.references, count, null),
    referenceRoles: ensureSlotArrayLength(shot.referenceRoles, count, 'None'),
    transformedReferences: ensureSlotArrayLength(shot.transformedReferences, count, null),
    themeTransformFingerprint: ensureSlotArrayLength(shot.themeTransformFingerprint, count, null),
    themeTransformStatus: ensureSlotArrayLength(
      shot.themeTransformStatus,
      count,
      'idle' as ThemeTransformSlotStatus,
    ),
    themeTransformError: ensureSlotArrayLength(shot.themeTransformError, count, null),
    themeTransformLinked: ensureSlotArrayLength(shot.themeTransformLinked, count, false),
  };
}

export function appendReferenceSlotPatch(shot: Shot): ReferenceSlotArrays {
  const normalized = normalizeReferenceSlotArrays(shot);
  const nextCount = normalized.references.length + 1;
  return {
    references: [...normalized.references, null],
    referenceRoles: [...normalized.referenceRoles, 'None'],
    transformedReferences: ensureSlotArrayLength(normalized.transformedReferences, nextCount, null),
    themeTransformFingerprint: ensureSlotArrayLength(
      normalized.themeTransformFingerprint,
      nextCount,
      null,
    ),
    themeTransformStatus: ensureSlotArrayLength(
      normalized.themeTransformStatus,
      nextCount,
      'idle',
    ),
    themeTransformError: ensureSlotArrayLength(normalized.themeTransformError, nextCount, null),
    themeTransformLinked: ensureSlotArrayLength(normalized.themeTransformLinked, nextCount, false),
  };
}

export function removeReferenceSlotPatch(
  shot: Shot,
  index: number,
): ReferenceSlotArrays | null {
  if (index < MIN_REFERENCE_SLOTS) return null;
  const normalized = normalizeReferenceSlotArrays(shot);
  if (index >= normalized.references.length) return null;

  const spliceAt = <T,>(arr: T[]): T[] => {
    const next = [...arr];
    next.splice(index, 1);
    return next;
  };

  return {
    references: spliceAt(normalized.references),
    referenceRoles: spliceAt(normalized.referenceRoles),
    transformedReferences: spliceAt(normalized.transformedReferences),
    themeTransformFingerprint: spliceAt(normalized.themeTransformFingerprint),
    themeTransformStatus: spliceAt(normalized.themeTransformStatus),
    themeTransformError: spliceAt(normalized.themeTransformError),
    themeTransformLinked: spliceAt(normalized.themeTransformLinked),
  };
}