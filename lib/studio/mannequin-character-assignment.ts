import { normalizeReferenceRole } from '@/lib/constants/camera';
import { getReferenceSlotCount } from '@/lib/studio/reference-slots';
import {
  areSubjectSheetsComplete,
  getSubjectChecklistSlotIndices,
  getSubjectSheetSlotCount,
} from '@/lib/studio/subject-sheet-slots';
import { migrateMannequin, migrateMannequins } from '@/lib/studio/migrate-mannequin';
import type { LightingSettings, Mannequin, Shot } from '@/lib/types/studio';
import { effectiveReferenceUrl } from '@/lib/studio/theme-transform';

export const PRINCIPAL_MANNEQUIN_OPACITY_MIN = 0.5;

export const SUBJECT_LINK_COLORS = [
  {
    ring: 'ring-2 ring-sky-400/80',
    stroke: 'rgba(56, 189, 248, 0.65)',
    strokeActive: 'rgba(125, 211, 252, 0.95)',
    outlet: 'character-link-outlet--sky',
    slot: 'reference-slot--character-linked-sky',
  },
  {
    ring: 'ring-2 ring-amber-400/80',
    stroke: 'rgba(251, 191, 36, 0.65)',
    strokeActive: 'rgba(252, 211, 77, 0.95)',
    outlet: 'character-link-outlet--amber',
    slot: 'reference-slot--character-linked-amber',
  },
  {
    ring: 'ring-2 ring-emerald-400/80',
    stroke: 'rgba(52, 211, 153, 0.65)',
    strokeActive: 'rgba(110, 231, 183, 0.95)',
    outlet: 'character-link-outlet--emerald',
    slot: 'reference-slot--character-linked-emerald',
  },
] as const;

export function subjectLinkColorIndex(slotIndex: number): number {
  return ((slotIndex % SUBJECT_LINK_COLORS.length) + SUBJECT_LINK_COLORS.length) % SUBJECT_LINK_COLORS.length;
}

export function countMannequinsLinkedToSlot(
  mannequins: Mannequin[] | undefined,
  slotIndex: number,
): number {
  return migrateMannequins(mannequins).filter((m) => m.subjectSlotIndex === slotIndex).length;
}

export function isPrincipalMannequin(mannequin: Mannequin): boolean {
  return (mannequin.opacity ?? 1) >= PRINCIPAL_MANNEQUIN_OPACITY_MIN;
}

export function getPrincipalMannequins(mannequins: Mannequin[] | undefined): Mannequin[] {
  return migrateMannequins(mannequins).filter(isPrincipalMannequin);
}

function slotHasSubjectImage(
  shot: Shot,
  index: number,
  lighting?: LightingSettings,
): boolean {
  if (index < 0 || index >= getReferenceSlotCount(shot)) return false;
  const role = normalizeReferenceRole(shot.referenceRoles[index] ?? 'None');
  if (role !== 'Subject') return false;
  const url = effectiveReferenceUrl(shot, index, lighting ?? shot.lighting) ?? shot.references[index];
  return Boolean(url);
}

export function isValidSubjectSlotAssignment(
  shot: Shot,
  slotIndex: number | undefined,
  lighting?: LightingSettings,
): boolean {
  if (slotIndex == null || slotIndex < 0) return false;
  return slotHasSubjectImage(shot, slotIndex, lighting);
}

/** All filled reference slots with role Subject. */
export function getSubjectSlotIndices(shot: Shot, lighting?: LightingSettings): number[] {
  const count = getReferenceSlotCount(shot);
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    if (slotHasSubjectImage(shot, i, lighting)) indices.push(i);
  }
  return indices;
}

export function sanitizeMannequinSubjectSlots(
  shot: Shot,
  mannequins: Mannequin[] | undefined,
  lighting?: LightingSettings,
): Mannequin[] {
  return migrateMannequins(mannequins).map((m) => {
    if (m.subjectSlotIndex == null) return m;
    if (!isValidSubjectSlotAssignment(shot, m.subjectSlotIndex, lighting)) {
      const { subjectSlotIndex: _, ...rest } = m;
      return migrateMannequin(rest as Mannequin);
    }
    return m;
  });
}

export function getAssignedMannequins(shot: Shot, lighting?: LightingSettings): Mannequin[] {
  return getPrincipalMannequins(shot.mannequins).filter((m) =>
    isValidSubjectSlotAssignment(shot, m.subjectSlotIndex, lighting),
  );
}

/** Principal cast size from placed mannequins, or expected count from camera before seed. */
export function getExpectedPrincipalCount(shot: Shot): number {
  switch (shot.camera.subjectCount) {
    case '1s':
      return 1;
    case '2s':
      return 2;
    case '3s':
      return 3;
    case 'group':
      return 4;
    case 'crowd':
      return shot.camera.heroSubjectsEnabled ? 2 : 0;
    default:
      return 1;
  }
}

export function getRequiredSubjectSheetCount(shot: Shot): number {
  const principals = getPrincipalMannequins(shot.mannequins);
  if (principals.length > 0) return principals.length;
  if (shot.workflow === 'bake-start-frame') {
    return getSubjectSheetSlotCount(shot);
  }
  return getExpectedPrincipalCount(shot);
}

export function areCharacterSheetsComplete(shot: Shot, lighting?: LightingSettings): boolean {
  if (shot.workflow === 'bake-start-frame') {
    return areSubjectSheetsComplete(shot, lighting);
  }
  const required = getRequiredSubjectSheetCount(shot);
  if (required === 0) return true;
  return getSubjectSlotIndices(shot, lighting).length >= required;
}

export function requiresCharacterAssignment(shot: Shot, lighting?: LightingSettings): boolean {
  return getSubjectSlotIndices(shot, lighting).length > 0;
}

export function isCharacterAssignmentComplete(shot: Shot, lighting?: LightingSettings): boolean {
  if (shot.camera.subjectCount === 'crowd' && !shot.camera.heroSubjectsEnabled) {
    return true;
  }

  const principals = getPrincipalMannequins(shot.mannequins);
  if (principals.length === 0) return false;
  const checklistSlots = getSubjectChecklistSlotIndices(shot);
  if (checklistSlots.length > 0) {
    const allowedSlots = new Set(checklistSlots);
    return principals.every(
      (m) =>
        m.subjectSlotIndex != null &&
        allowedSlots.has(m.subjectSlotIndex) &&
        isValidSubjectSlotAssignment(shot, m.subjectSlotIndex, lighting),
    );
  }
  const subjectSlots = getSubjectSlotIndices(shot, lighting);
  if (subjectSlots.length === 0) return shot.camera.subjectCount === 'crowd';
  return principals.every((m) => isValidSubjectSlotAssignment(shot, m.subjectSlotIndex, lighting));
}

export type MannequinSpatialLabel = 'leftmost' | 'center' | 'rightmost' | 'sole';

export function mannequinSpatialLabel(
  mannequin: Mannequin,
  principals: Mannequin[],
): MannequinSpatialLabel {
  const sorted = [...principals].sort((a, b) => a.x - b.x);
  if (sorted.length <= 1) return 'sole';
  const idx = sorted.findIndex((m) => m.id === mannequin.id);
  if (idx < 0) return 'sole';
  if (sorted.length === 2) return idx === 0 ? 'leftmost' : 'rightmost';
  if (idx === 0) return 'leftmost';
  if (idx === sorted.length - 1) return 'rightmost';
  return 'center';
}

export function clearMannequinAssignmentsForSlot(
  mannequins: Mannequin[],
  slotIndex: number,
): Mannequin[] {
  return migrateMannequins(mannequins).map((m) => {
    if (m.subjectSlotIndex !== slotIndex) return m;
    const { subjectSlotIndex: _, ...rest } = m;
    return migrateMannequin(rest as Mannequin);
  });
}

export function reindexMannequinAssignmentsAfterSlotRemoval(
  mannequins: Mannequin[],
  removedIndex: number,
): Mannequin[] {
  return migrateMannequins(mannequins).map((m) => {
    if (m.subjectSlotIndex == null) return m;
    if (m.subjectSlotIndex === removedIndex) {
      const { subjectSlotIndex: _, ...rest } = m;
      return migrateMannequin(rest as Mannequin);
    }
    if (m.subjectSlotIndex > removedIndex) {
      return { ...m, subjectSlotIndex: m.subjectSlotIndex - 1 };
    }
    return m;
  });
}

export function applyMannequinSubjectSlot(
  mannequins: Mannequin[],
  mannequinId: string,
  slotIndex: number | null,
): Mannequin[] {
  return migrateMannequins(mannequins).map((m) => {
    if (m.id === mannequinId) {
      if (slotIndex === null) {
        const { subjectSlotIndex: _, ...rest } = m;
        return migrateMannequin(rest as Mannequin);
      }
      return { ...m, subjectSlotIndex: slotIndex };
    }
    if (slotIndex !== null && m.subjectSlotIndex === slotIndex) {
      const { subjectSlotIndex: _, ...rest } = m;
      return migrateMannequin(rest as Mannequin);
    }
    return m;
  });
}

/** Single principal + single Subject slot → auto-link (preserves legacy single-subject bake). */
export function tryAutoAssignSingleSubject(shot: Shot, mannequins: Mannequin[]): Mannequin[] {
  const principals = getPrincipalMannequins(mannequins);
  const subjectSlots = getSubjectSlotIndices(shot);
  if (principals.length !== 1 || subjectSlots.length !== 1) return mannequins;
  const principal = principals[0];
  if (isValidSubjectSlotAssignment(shot, principal.subjectSlotIndex)) return mannequins;
  return applyMannequinSubjectSlot(mannequins, principal.id, subjectSlots[0]);
}