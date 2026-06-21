import { describe, expect, it } from 'vitest';
import {
  groupMediaAssetsByType,
  MEDIA_ASSET_TYPE_ORDER,
  searchMediaLibrary,
  updateMediaAssetInLibrary,
} from '@/lib/media/media-library-query';
import type { MediaAsset, ShotWorkflowSnapshot } from '@/lib/types/media-library';
import type { Shot } from '@/lib/types/studio';

function asset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'abc123',
    type: 'baked-frame',
    url: 'data:image/png;base64,x',
    createdAt: 1000,
    workflowOrigin: 'bake-start-frame',
    metadata: { usedInShots: [1], prompt: 'golden hour surfer' },
    ...overrides,
  };
}

describe('groupMediaAssetsByType', () => {
  it('orders groups by MEDIA_ASSET_TYPE_ORDER', () => {
    const groups = groupMediaAssetsByType([
      asset({ id: '1', type: 'video' }),
      asset({ id: '2', type: 'baked-frame' }),
      asset({ id: '3', type: 'backdrop' }),
    ]);
    expect(groups.map((g) => g.type)).toEqual(['backdrop', 'baked-frame', 'video']);
    expect(groups[0]?.type).toBe(MEDIA_ASSET_TYPE_ORDER.find((t) => t === 'backdrop'));
  });
});

describe('searchMediaLibrary', () => {
  const shots = [{ id: 1, name: 'Shot 01' }] as Shot[];
  const snapshots: ShotWorkflowSnapshot[] = [
    {
      id: 'snap-1',
      workflow: 'bake-start-frame',
      shotId: 1,
      shotName: 'Shot 01',
      createdAt: 1,
      checklistProgress: {},
      assetIds: {},
    },
  ];

  it('matches prompt text and shot names', () => {
    const byPrompt = searchMediaLibrary({
      assets: [asset()],
      snapshots,
      query: 'surfer',
      typeFilter: 'all',
      shots,
    });
    expect(byPrompt.assets).toHaveLength(1);

    const byShot = searchMediaLibrary({
      assets: [asset({ metadata: { usedInShots: [1], prompt: 'x' } })],
      snapshots,
      query: 'shot 01',
      typeFilter: 'all',
      shots,
    });
    expect(byShot.assets).toHaveLength(1);
  });

  it('filters by type', () => {
    const result = searchMediaLibrary({
      assets: [asset(), asset({ id: 'b', type: 'backdrop' })],
      snapshots,
      query: '',
      typeFilter: 'backdrop',
      shots,
    });
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]?.type).toBe('backdrop');
    expect(result.snapshots).toHaveLength(0);
  });
});

describe('updateMediaAssetInLibrary', () => {
  it('merges metadata without dropping usedInShots', () => {
    const library = updateMediaAssetInLibrary([asset()], 'abc123', {
      metadata: { prompt: 'updated', provider: 'xai' },
    });
    expect(library[0]?.metadata.prompt).toBe('updated');
    expect(library[0]?.metadata.provider).toBe('xai');
    expect(library[0]?.metadata.usedInShots).toEqual([1]);
  });
});
