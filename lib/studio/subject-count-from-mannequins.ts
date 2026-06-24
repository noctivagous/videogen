import {
  defaultArrangementForSubjectCount,
  normalizeArrangement,
} from '@/lib/constants/arrangement-options';
import { SINGLE_ONLY_COVERAGE } from '@/lib/constants/camera';
import { applyFrameCompositionSmartDefaults } from '@/lib/studio/composition';
import {
  clearMannequinAssignmentsForSlot,
  getPrincipalMannequins,
} from '@/lib/studio/mannequin-character-assignment';
import { migrateMannequins } from '@/lib/studio/migrate-mannequin';
import { syncMannequinsFromShot } from '@/lib/studio/mannequin-sync';
import { finalizeMannequinsForShot } from '@/lib/studio/workflow';
import {
  ensureSubjectChecklistSlots,
  getRemovedSubjectChecklistSlots,
} from '@/lib/studio/subject-sheet-slots';
import type { AspectRatio, Mannequin, Shot, SubjectCount } from '@/lib/types/studio';

export const MAX_PRINCIPAL_MANNEQUINS = 10;

export function subjectCountForPrincipalCount(count: number): SubjectCount {
  if (count >= 6) return 'crowd';
  if (count >= 4) return 'group';
  if (count === 3) return '3s';
  if (count === 2) return '2s';
  return '1s';
}

export function subjectCountFromMannequins(mannequins: Mannequin[] | undefined): SubjectCount {
  return subjectCountForPrincipalCount(getPrincipalMannequins(mannequins).length);
}

/** Apply a subject-count change while preserving the given mannequin list. */
export function applySubjectCountToShot(
  prevShot: Shot,
  subjectCount: SubjectCount,
  mannequins: Mannequin[],
  aspectRatio: AspectRatio = '16:9',
): Pick<Shot, 'camera' | 'frameComposition' | 'mannequins'> & {
  slotPatch: Partial<Shot>;
} {
  const prevForResync: Shot = { ...prevShot, mannequins };
  const next = { ...prevShot.camera, subjectCount };

  if (next.subjectCount !== '1s' && SINGLE_ONLY_COVERAGE.has(next.coverage)) {
    next.coverage = 'clean';
  }
  next.arrangement = defaultArrangementForSubjectCount(next.subjectCount);
  if (next.subjectCount === 'crowd') {
    next.heroSubjectsEnabled = false;
  }
  next.arrangement = normalizeArrangement(next.subjectCount, next.arrangement);

  const frameComposition = { ...prevShot.frameComposition };
  applyFrameCompositionSmartDefaults(next, frameComposition);

  const nextShot: Shot = { ...prevForResync, camera: next, frameComposition };
  const resynced = syncMannequinsFromShot(nextShot, mannequins, {
    reason: 'camera',
    prevShot: prevForResync,
    aspectRatio,
  });
  let mergedMannequins = finalizeMannequinsForShot(nextShot, resynced);

  let mergedShot: Shot = { ...nextShot, mannequins: mergedMannequins };
  const slotPatch = ensureSubjectChecklistSlots(mergedShot) ?? {};
  mergedShot = { ...mergedShot, ...slotPatch };

  const removedSubjectSlots = getRemovedSubjectChecklistSlots(prevShot, mergedShot);
  if (removedSubjectSlots.length > 0 && mergedShot.mannequins?.length) {
    let cleared = migrateMannequins(mergedShot.mannequins);
    for (const slotIndex of removedSubjectSlots) {
      cleared = clearMannequinAssignmentsForSlot(cleared, slotIndex);
    }
    mergedMannequins = cleared;
  }

  return {
    camera: next,
    frameComposition,
    mannequins: mergedMannequins,
    slotPatch,
  };
}
