import type { ReferenceMode, Shot } from '@/lib/types/studio';

export const DEFAULT_REFERENCE_MODE: ReferenceMode = 'auto-roles';

export const REFERENCE_MODE_OPTIONS: ReadonlyArray<{ value: ReferenceMode; label: string }> = [
  { value: 'auto-roles', label: 'Auto-Roles' },
  { value: 'manual', label: 'Manual' },
];

export function normalizeReferenceMode(
  shot: Pick<Shot, 'referenceMode' | 'cinematographyRefs'> | undefined,
): ReferenceMode {
  if (shot?.referenceMode) return shot.referenceMode;
  if (shot?.cinematographyRefs === false) return 'manual';
  return DEFAULT_REFERENCE_MODE;
}

export function isAutoRolesReferenceMode(
  shot: Pick<Shot, 'referenceMode' | 'cinematographyRefs'> | undefined,
): boolean {
  return normalizeReferenceMode(shot) === 'auto-roles';
}