import { describe, expect, it } from 'vitest';
import {
  applyShotWorkflowState,
  extractShotWorkflowState,
  migrateShotWorkflowStates,
  switchShotWorkflow,
} from '@/lib/studio/shot-workflow-state';
import { groupMediaAssetsByShotAndWorkflow } from '@/lib/media/media-library-query';
import type { MediaAsset } from '@/lib/types/media-library';
import type { Shot } from '@/lib/types/studio';

function shot(overrides: Partial<Shot> = {}): Shot {
  return {
    id: 1,
    name: 'Shot 01',
    duration: 5,
    thumbnail: null,
    videoUrl: null,
    active: true,
    workflow: 'bake-start-frame',
    bakedStartFrame: 'data:baked-a',
    bakeStatus: 'ready',
    references: [],
    referenceRoles: [],
  } as unknown as Shot;
}

describe('shot-workflow-state', () => {
  it('switchShotWorkflow preserves prior workflow and restores saved state', () => {
    const base = shot({
      bakedStartFrame: 'data:baked-a',
      bakeStatus: 'ready',
      savedBakedFrameAssetIds: ['asset-a'],
    });

    const switched = { ...base, ...switchShotWorkflow(base, 'auto-place') };
    expect(switched.workflow).toBe('auto-place');
    expect(switched.bakedStartFrame).toBeNull();
    expect(switched.workflowStates?.['bake-start-frame']?.bakedStartFrame).toBe('data:baked-a');

    const restored = { ...switched, ...switchShotWorkflow(switched, 'bake-start-frame') };
    expect(restored.bakedStartFrame).toBe('data:baked-a');
    expect(restored.bakeStatus).toBe('ready');
  });

  it('migrateShotWorkflowStates seeds workflowStates from active fields', () => {
    const migrated = migrateShotWorkflowStates(shot());
    expect(migrated.workflowStates?.['bake-start-frame']?.bakedStartFrame).toBe('data:baked-a');
  });

  it('extract and apply round-trip workflow fields', () => {
    const state = extractShotWorkflowState(shot());
    const applied = applyShotWorkflowState(state, 'bake-start-frame');
    expect(applied.bakedStartFrame).toBe('data:baked-a');
    expect(applied.bakeStatus).toBe('ready');
  });
});

describe('groupMediaAssetsByShotAndWorkflow', () => {
  it('groups assets under shot and workflow origin', () => {
    const assets: MediaAsset[] = [
      {
        id: 'a1',
        type: 'baked-frame',
        url: 'data:1',
        createdAt: 1,
        workflowOrigin: 'bake-start-frame',
        metadata: { usedInShots: [1] },
      },
      {
        id: 'a2',
        type: 'reference',
        url: 'data:2',
        createdAt: 2,
        workflowOrigin: 'auto-place',
        metadata: { usedInShots: [1] },
      },
      {
        id: 'a3',
        type: 'reference',
        url: 'data:3',
        createdAt: 3,
        metadata: { usedInShots: [] },
      },
    ];
    const shots = [{ id: 1, name: 'Shot 01' }] as Shot[];
    const { shotGroups, unassigned } = groupMediaAssetsByShotAndWorkflow(assets, shots);
    expect(shotGroups).toHaveLength(1);
    expect(shotGroups[0]?.workflows).toHaveLength(2);
    expect(unassigned).toHaveLength(1);
  });
});
