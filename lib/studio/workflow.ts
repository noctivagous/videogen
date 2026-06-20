import { normalizeReferenceRole, PLACEMENT_POSITIONS } from '@/lib/constants/camera';
import { FIELD_SIZE_HEIGHT_PCT } from '@/lib/constants/framing';
import { normalizeWorkflow } from '@/lib/constants/workflows';
import { getBackdropSlotIndex } from '@/lib/studio/backdrop-framing';
import { getSubjectReference } from '@/lib/constants/stock-demo';
import { getShotFrameComposition } from '@/lib/studio/composition';
import type {
  AspectRatio,
  BakeStatus,
  LightingSettings,
  Mannequin,
  MannequinAngle,
  ReferenceRole,
  Shot,
  Workflow,
} from '@/lib/types/studio';
import { effectiveReferenceUrl } from '@/lib/studio/theme-transform';

export type WorkflowStepId = 'character-sheet' | 'backdrop' | 'place-mannequins' | 'bake';

export interface WorkflowReferenceStep {
  id: WorkflowStepId;
  label: string;
  done: boolean;
}

export function getWorkflow(shot: Shot | undefined): Workflow {
  return normalizeWorkflow(shot);
}

export function isLockStartFrame(shot: Shot | undefined): boolean {
  return getWorkflow(shot) === 'lock-start-frame';
}

function subjectSlotIndex(shot: Shot): number {
  for (let i = 0; i < shot.referenceRoles.length; i++) {
    if (normalizeReferenceRole(shot.referenceRoles[i] ?? 'None') === 'Subject') return i;
  }
  return 1;
}

function slotHasImage(
  shot: Shot,
  index: number,
  lighting?: LightingSettings,
): boolean {
  const url = effectiveReferenceUrl(shot, index, lighting ?? shot.lighting);
  return Boolean(url ?? shot.references[index]);
}

export function getWorkflowReferenceSteps(
  shot: Shot | undefined,
  lighting?: LightingSettings,
): WorkflowReferenceStep[] {
  if (!shot || !isLockStartFrame(shot)) return [];

  const subjectIdx = subjectSlotIndex(shot);
  const backdropIdx = getBackdropSlotIndex(shot);
  const bakeStatus: BakeStatus = shot.bakeStatus ?? 'idle';

  return [
    {
      id: 'character-sheet',
      label: 'Character Sheet',
      done: slotHasImage(shot, subjectIdx, lighting),
    },
    {
      id: 'backdrop',
      label: 'Backdrop',
      done: backdropIdx >= 0 && slotHasImage(shot, backdropIdx, lighting),
    },
    {
      id: 'place-mannequins',
      label: 'Place Mannequins',
      done: (shot.mannequins?.length ?? 0) > 0,
    },
    {
      id: 'bake',
      label: 'Bake',
      done: bakeStatus === 'ready' && Boolean(shot.bakedStartFrame),
    },
  ];
}

export function shouldInjectFieldSizePrompt(shot: Shot | undefined): boolean {
  return !isLockStartFrame(shot);
}

export function getMannequinLimit(shot: Shot | undefined): number {
  if (!shot) return 1;
  if (shot.camera.subjectCount === '1s' && shot.camera.coverage === 'dirty-single') {
    return 2;
  }
  switch (shot.camera.subjectCount) {
    case '2s':
      return 2;
    case '3s':
      return 3;
    default:
      return 1;
  }
}

export function canAddMannequin(shot: Shot | undefined): boolean {
  if (!isLockStartFrame(shot) || !shot) return false;
  return (shot.mannequins?.length ?? 0) < getMannequinLimit(shot);
}

function newMannequinId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mannequin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultMannequin(
  partial: Partial<Mannequin> & { angle?: MannequinAngle } = {},
): Mannequin {
  return {
    id: partial.id ?? newMannequinId(),
    angle: partial.angle ?? 'front',
    gender: partial.gender ?? 'male',
    age: partial.age ?? 'adult',
    pose: partial.pose ?? 'standard',
    x: partial.x ?? 0.5,
    y: partial.y ?? 0.85,
    scale: partial.scale ?? 1,
    rotation: partial.rotation ?? 0,
    opacity: partial.opacity ?? 1,
  };
}

/** Default mannequin layout from camera subject count, field size, and placement grid. */
export function seedMannequinsForShot(shot: Shot): Mannequin[] {
  const frame = getShotFrameComposition(shot);
  const placement = PLACEMENT_POSITIONS[frame.placement] ?? PLACEMENT_POSITIONS['cell-1-1'];
  const anchorX = placement.x / 100;
  const feetY = 0.85;
  const fieldScale =
    (FIELD_SIZE_HEIGHT_PCT[shot.camera.fieldSize] ?? FIELD_SIZE_HEIGHT_PCT.ms) /
    FIELD_SIZE_HEIGHT_PCT.ms;
  const count = getMannequinLimit(shot);

  if (count === 1) {
    if (shot.camera.coverage === 'dirty-single') {
      return [
        createDefaultMannequin({ x: anchorX, y: feetY, scale: fieldScale }),
        createDefaultMannequin({
          x: Math.min(0.92, anchorX + 0.2),
          y: feetY,
          scale: fieldScale * 1.1,
          opacity: 0.3,
          angle: 'threeQuarterLeft',
          rotation: -15,
        }),
      ];
    }
    return [createDefaultMannequin({ x: anchorX, y: feetY, scale: fieldScale })];
  }

  if (count === 2) {
    return [
      createDefaultMannequin({
        x: anchorX - 0.12,
        y: feetY,
        scale: fieldScale,
        rotation: -12,
        angle: 'threeQuarterRight',
      }),
      createDefaultMannequin({
        x: anchorX + 0.12,
        y: feetY,
        scale: fieldScale,
        rotation: 12,
        angle: 'threeQuarterLeft',
      }),
    ];
  }

  return [
    createDefaultMannequin({ x: anchorX - 0.14, y: feetY, scale: fieldScale, rotation: -12 }),
    createDefaultMannequin({ x: anchorX, y: feetY, scale: fieldScale }),
    createDefaultMannequin({ x: anchorX + 0.14, y: feetY, scale: fieldScale, rotation: 12 }),
  ];
}

export function getSubjectSheetUrl(shot: Shot | undefined, lighting?: LightingSettings): string | null {
  if (!shot) return null;
  const idx = subjectSlotIndex(shot);
  const url = effectiveReferenceUrl(shot, idx, lighting ?? shot.lighting) ?? shot.references[idx];
  return url ?? getSubjectReference(shot) ?? null;
}

/** Video/API refs when lock-start-frame bake is ready. */
export function buildWorkflowGenerationRefs(
  shot: Shot | undefined,
  lighting?: LightingSettings,
  aspectRatio?: AspectRatio,
): Array<{ role: ReferenceRole; url: string; slotIndex: number }> | null {
  if (!shot || !isLockStartFrame(shot) || !shot.bakedStartFrame) return null;

  const subjectUrl = getSubjectSheetUrl(shot, lighting);
  const refs: Array<{ role: ReferenceRole; url: string; slotIndex: number }> = [
    { role: 'Backdrop', url: shot.bakedStartFrame, slotIndex: -1 },
  ];
  if (subjectUrl) {
    refs.push({ role: 'Subject', url: subjectUrl, slotIndex: subjectSlotIndex(shot) });
  }
  return refs;
}