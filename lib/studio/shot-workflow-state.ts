import { normalizeWorkflow } from '@/lib/constants/workflows';
import type { Shot, ShotWorkflowState, Workflow } from '@/lib/types/studio';

export type { ShotWorkflowState };

export function emptyShotWorkflowState(): ShotWorkflowState {
  return {
    bakedStartFrame: null,
    bakedIntermediateFrame: null,
    bakeStatus: 'idle',
    savedBakedFrameAssetIds: [],
    linkedAssetIds: {},
    mannequins: undefined,
    workflowSnapshotId: null,
  };
}

export function extractShotWorkflowState(shot: Shot): ShotWorkflowState {
  return {
    bakedStartFrame: shot.bakedStartFrame ?? null,
    bakedIntermediateFrame: shot.bakedIntermediateFrame ?? null,
    bakeStatus: shot.bakeStatus ?? 'idle',
    savedBakedFrameAssetIds: shot.savedBakedFrameAssetIds ?? [],
    linkedAssetIds: { ...(shot.linkedAssetIds ?? {}) },
    mannequins: shot.mannequins,
    workflowSnapshotId: shot.workflowSnapshotId ?? null,
  };
}

export function applyShotWorkflowState(
  state: ShotWorkflowState | undefined,
  workflow: Workflow,
): Partial<Shot> {
  const saved = state ?? emptyShotWorkflowState();
  return {
    workflow,
    bakedStartFrame: saved.bakedStartFrame ?? null,
    bakedIntermediateFrame: saved.bakedIntermediateFrame ?? null,
    bakeStatus: saved.bakeStatus ?? 'idle',
    savedBakedFrameAssetIds: saved.savedBakedFrameAssetIds ?? [],
    linkedAssetIds: { ...(saved.linkedAssetIds ?? {}) },
    mannequins: saved.mannequins,
    workflowSnapshotId: saved.workflowSnapshotId ?? null,
  };
}

/** Persist active workflow state and load the target workflow onto the shot. */
export function switchShotWorkflow(shot: Shot, toWorkflow: Workflow): Partial<Shot> {
  const fromWorkflow = normalizeWorkflow(shot);
  const workflowStates: Partial<Record<Workflow, ShotWorkflowState>> = {
    ...(shot.workflowStates ?? {}),
    [fromWorkflow]: extractShotWorkflowState(shot),
  };
  return {
    workflowStates,
    ...applyShotWorkflowState(workflowStates[toWorkflow], toWorkflow),
  };
}

export function migrateShotWorkflowStates(shot: Shot): Shot {
  if (shot.workflowStates && Object.keys(shot.workflowStates).length > 0) {
    return shot;
  }

  const workflow = normalizeWorkflow(shot);
  const hasWorkflowData =
    Boolean(shot.bakedStartFrame) ||
    Boolean(shot.bakedIntermediateFrame) ||
    (shot.savedBakedFrameAssetIds?.length ?? 0) > 0 ||
    Object.keys(shot.linkedAssetIds ?? {}).length > 0 ||
    (shot.mannequins?.length ?? 0) > 0 ||
    shot.bakeStatus === 'ready';

  if (!hasWorkflowData) return shot;

  return {
    ...shot,
    workflowStates: {
      [workflow]: extractShotWorkflowState(shot),
    },
  };
}

export function shotHasWorkflowState(shot: Shot, workflow: Workflow): boolean {
  return Boolean(shot.workflowStates?.[workflow]);
}
