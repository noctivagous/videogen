import type { ReferenceRole, Shot } from '@/lib/types/studio';

/** When true (default), slots use Subject/Backdrop/Other/Style and role-aware prompt assembly. */
export function isCinematographyRefs(shot: Shot | undefined): boolean {
  return shot?.cinematographyRefs !== false;
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
    return `Image ${slotIndex + 1}`;
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