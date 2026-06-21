import { normalizeReferenceRole } from '@/lib/constants/camera';
import { getBackdropSlotIndex } from '@/lib/studio/backdrop-framing';
import {
  appendReferenceSlotPatch,
  getReferenceSlotCount,
  MIN_REFERENCE_SLOTS,
  normalizeReferenceSlotArrays,
} from '@/lib/studio/reference-slots';
import type { LightingSettings, ReferenceRole, Shot, SubjectCount } from '@/lib/types/studio';
import { effectiveReferenceUrl } from '@/lib/studio/theme-transform';

const HERO_SUBJECT_SLOT_COUNT = 2;

export function isMultiSubjectSheetCount(subjectCount: SubjectCount): boolean {
  return ['1s', '2s', '3s', 'group'].includes(subjectCount);
}

/** @deprecated Use isMultiSubjectSheetCount — kept for callers expecting bake-only counts. */
export function isBakeSubjectCount(subjectCount: SubjectCount): boolean {
  return isMultiSubjectSheetCount(subjectCount);
}

/** Required character sheet slots for checklist (0 for crowd without heroes). */
export function getSubjectSheetSlotCount(shot: Pick<Shot, 'camera'>): number {
  const { subjectCount, heroSubjectsEnabled } = shot.camera;
  switch (subjectCount) {
    case '2s':
      return 2;
    case '3s':
      return 3;
    case 'group':
      return 4;
    case 'crowd':
      return heroSubjectsEnabled ? HERO_SUBJECT_SLOT_COUNT : 0;
    default:
      return 1;
  }
}

export function isCrowdHeroMode(shot: Pick<Shot, 'camera'>): boolean {
  return shot.camera.subjectCount === 'crowd' && shot.camera.heroSubjectsEnabled;
}

export function getCharacterSheetsStepLabel(shot: Shot): string {
  const count = getSubjectSheetSlotCount(shot);
  if (isCrowdHeroMode(shot)) {
    return count > 1 ? `Hero Character Sheets (${count})` : 'Hero Character Sheet';
  }
  return count > 1 ? `Character Sheets (${count})` : count === 0 ? 'Character Sheets' : 'Character Sheet';
}

function isSubjectRole(role: string | undefined): boolean {
  return normalizeReferenceRole(role ?? 'None') === 'Subject';
}

/** Ordered checklist slot indices designated for character sheets (excludes backdrop). */
export function getSubjectChecklistSlotIndices(shot: Shot): number[] {
  const required = getSubjectSheetSlotCount(shot);
  if (required === 0) return [];

  const backdropIdx = getBackdropSlotIndex(shot);
  const indices: number[] = [];

  for (let i = 0; i < getReferenceSlotCount(shot); i++) {
    if (i === backdropIdx) continue;
    if (isSubjectRole(shot.referenceRoles[i])) {
      indices.push(i);
    }
  }

  if (indices.length >= required) {
    return indices.slice(0, required);
  }

  for (let i = 0; i < getReferenceSlotCount(shot) && indices.length < required; i++) {
    if (i === backdropIdx || indices.includes(i)) continue;
    indices.push(i);
  }

  return indices.slice(0, required);
}

export function getSubjectSlotDisplayLabel(shot: Shot, _slotIndex: number, ordinal: number): string {
  if (isCrowdHeroMode(shot)) {
    return `Hero ${ordinal}`;
  }
  return `Character ${ordinal}`;
}

export function getSubjectSlotOrdinal(shot: Shot, slotIndex: number): number | null {
  const indices = getSubjectChecklistSlotIndices(shot);
  const idx = indices.indexOf(slotIndex);
  return idx >= 0 ? idx + 1 : null;
}

function slotHasSubjectImage(
  shot: Shot,
  index: number,
  lighting?: LightingSettings,
): boolean {
  if (index < 0 || index >= getReferenceSlotCount(shot)) return false;
  if (!isSubjectRole(shot.referenceRoles[index])) return false;
  const url = effectiveReferenceUrl(shot, index, lighting ?? shot.lighting) ?? shot.references[index];
  return Boolean(url);
}

export function areSubjectSheetsComplete(shot: Shot, lighting?: LightingSettings): boolean {
  const required = getSubjectSheetSlotCount(shot);
  if (required === 0) return true;

  const indices = getSubjectChecklistSlotIndices(shot);
  if (indices.length < required) return false;

  if (isCrowdHeroMode(shot)) {
    return indices.slice(0, required).some((index) => slotHasSubjectImage(shot, index, lighting));
  }

  return indices.slice(0, required).every((index) => slotHasSubjectImage(shot, index, lighting));
}

function setRoleAt(roles: ReferenceRole[], index: number, role: ReferenceRole): ReferenceRole[] {
  const next = [...roles];
  while (next.length <= index) next.push('None');
  next[index] = role;
  return next;
}

function demoteExtraSubjectSlots(
  shot: Shot,
  keepIndices: ReadonlySet<number>,
): Partial<Shot> | null {
  const normalized = normalizeReferenceSlotArrays(shot);
  let changed = false;
  const referenceRoles = [...normalized.referenceRoles];

  for (let i = 0; i < referenceRoles.length; i++) {
    if (!isSubjectRole(referenceRoles[i])) continue;
    if (keepIndices.has(i)) continue;
    referenceRoles[i] = 'Style';
    changed = true;
  }

  return changed ? { referenceRoles } : null;
}

function minSlotsForRequired(required: number): number {
  return MIN_REFERENCE_SLOTS + Math.max(0, required - 2);
}

/** Ensures checklist has the correct number of Subject roles for camera.subjectCount. */
export function ensureSubjectChecklistSlots(shot: Shot): Partial<Shot> | null {
  const required = getSubjectSheetSlotCount(shot);

  if (required === 0) {
    const demoteAll = demoteExtraSubjectSlots(shot, new Set());
    return demoteAll;
  }

  const backdropIdx = getBackdropSlotIndex(shot);
  let working: Shot = { ...shot, ...normalizeReferenceSlotArrays(shot) };
  let patch: Partial<Shot> = {};
  const merge = (next: Partial<Shot>) => {
    patch = { ...patch, ...next };
    working = { ...working, ...next };
  };

  while (getReferenceSlotCount(working) < minSlotsForRequired(required)) {
    merge(appendReferenceSlotPatch(working));
  }

  const targetIndices: number[] = [];
  for (let ordinal = 0; ordinal < required; ordinal++) {
    const preferredIndex = backdropIdx >= 0 ? backdropIdx + 1 + ordinal : 1 + ordinal;
    if (preferredIndex < getReferenceSlotCount(working) && preferredIndex !== backdropIdx) {
      targetIndices.push(preferredIndex);
    }
  }

  while (targetIndices.length < required) {
    merge(appendReferenceSlotPatch(working));
    const nextIndex = getReferenceSlotCount(working) - 1;
    if (nextIndex !== backdropIdx) targetIndices.push(nextIndex);
  }

  let referenceRoles = [...(patch.referenceRoles ?? working.referenceRoles)];
  let rolesChanged = false;

  for (const index of targetIndices) {
    if (!isSubjectRole(referenceRoles[index])) {
      referenceRoles = setRoleAt(referenceRoles, index, 'Subject');
      rolesChanged = true;
    }
  }

  if (rolesChanged) {
    merge({ referenceRoles });
  }

  const keepSet = new Set(targetIndices);
  const demotePatch = demoteExtraSubjectSlots(working, keepSet);
  if (demotePatch) merge(demotePatch);

  return Object.keys(patch).length > 0 ? patch : null;
}

export function getRemovedSubjectChecklistSlots(prevShot: Shot, nextShot: Shot): number[] {
  const prev = new Set(getSubjectChecklistSlotIndices(prevShot));
  const next = new Set(getSubjectChecklistSlotIndices(nextShot));
  return [...prev].filter((index) => !next.has(index));
}
